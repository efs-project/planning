// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {LensReader} from "./LensReader.sol";

/// The exact public read ABI `JoinedConsumer` uses, declared consumer-locally (NOT a Core interface; no Core change).
/// The Ledger and LensReader satisfy it by their public getters (same selectors and return shapes), and a test can
/// substitute a faulty reader (`test/FaultyReads.sol`) that returns corrupted or missing ACTUAL replies, so the
/// consumer's refusals are tested against bad replies and not only against wrong expectations. `registry()` /
/// `index()` return the ABI address of the Ledger's `ITypeRegistry` / the LensReader's `IndexModule`.
interface ILedgerReads {
    function record(bytes32 id) external view returns (bytes32 typeId, uint64 firstAdmission, uint32 occurrences, bytes memory data);
    function admission(uint64 ordinal)
        external
        view
        returns (uint8 kind, uint16 leaf, uint64 publication, uint64 bindingOrdinal, uint32 expectedRevision, bool withdrawn, bytes32 a, bytes32 b);
    function evidence(uint64 publication)
        external
        view
        returns (
            address author,
            uint8 proofKind,
            uint8 v,
            uint16 leafCount,
            uint64 firstAdmission,
            bytes32 r,
            bytes32 s,
            uint64 nonce,
            uint64 deadline,
            uint64 basis,
            bytes32 acceptanceProfile,
            bytes32 indexObligations,
            bytes32 actionsHash
        );
    function counts() external view returns (uint64 admissions, uint64 records, uint64 bindings, uint64 publications);
    function positionCell(bytes32 position) external view returns (bytes32 purpose, bytes32 subject, bytes32 role);
    function registry() external view returns (address);
}

interface ILensReads {
    function resolve(address[] calldata lens, bytes32 purpose, bytes32 subject, bytes32 role)
        external
        view
        returns (uint8 status, bytes32 target, uint32 revision, address author, uint64 admissionOrdinal);
    function resolveNoTiebreak(address[] calldata lens, bytes32 purpose, bytes32 subject, bytes32 role)
        external
        view
        returns (uint8 status, LensReader.Entry[] memory candidates);
    function list(address[] calldata lens, bytes32 purpose, bytes32 subject, LensReader.Cursor calldata cursor, uint256 budget)
        external
        view
        returns (LensReader.Page memory page);
    function historyByRole(address author, bytes32 purpose, bytes32 subject, bytes32 role, uint64 asOf)
        external
        view
        returns (uint8 status, bool live, bytes32 target, uint32 revision, uint64 admissionOrdinal);
    function index() external view returns (address);
}

/// Basis getters reached through the read interfaces' `registry()` / `index()` addresses.
interface IRulesEpoch {
    function epoch() external view returns (uint64);
}

interface IIndexGeneration {
    function generation() external view returns (uint64);
}

/// TEST-ONLY MEASUREMENT CONSUMERS. DISPOSABLE LAB, NO PROTOCOL CLAIM. UNRUN (written under
/// another worker's compiler lease).
///
/// Both contracts are STATELESS: no method writes storage (no SSTORE), so a receipt's gas is the
/// paid-read budget WITHOUT the storage-write component that `LabHarness.Consumer` carries in its
/// `last*` slots. Each paid method returns explicit result commitments (keccak256 over the facts a
/// consumer would act on) and emits them in one `ResultCommitment` log so the retained receipt
/// carries what the transaction computed. For the `read*` methods that log is the only overhead
/// beyond the read itself (one LOG2 of 32 or 64 bytes: ESTIMATED ~1.5–1.9k gas; not storage); the
/// paid-slice `PaidResult` log carries ~34 data words (Selection 19 + Placement 14 + digest:
/// ESTIMATED ~9–10k gas) — the paid rows' consumer overhead, disclosed separately and never
/// subtracted. The measurement labels both. Nothing here is privileged, cached, seeded or read from private storage: every fact comes
/// through the LensReader / Ledger public interfaces, and every non-selected, conflicting,
/// unknown, malformed or partial outcome REVERTS instead of exposing a fabricated value.
///
/// The commitments are candidate-side observables. The measurement script recomputes their
/// expected values from the fixture; that comparison is a self-check, not the independent oracle.
///
/// SEALED PAID POINT/LIST SLICE (sdk-fixture appendix; matched-cost-scope-review "B counterpart"; 2026-09-13,
/// desk-checked only): `paidPoint` / `paidList` are the arm-neutral checks in B's native representation. The
/// caller supplies every expectation (`Expect`, `PlacementExpect`) from the sealed expectation manifest and the
/// arm-local fixture map; this consumer derives no id (no Keys import), reads no seeded answer, and reverts on
/// every outcome that is not found, supported, admitted and uniquely selected at the pinned basis. Placement
/// provenance (the one A placement: sourceStep A1, AUTHOR_A, EOA_SIGNED_PUBLICATION_EFFECT) is checked and
/// reported SEPARATELY from selected-content authorship — no equality between the two authors is required or
/// implied, so B-first selects B's head while the placement stays A's. Point and list share the same
/// Quote -> Pair -> two Items closure at the same admission-frontier basis; the list additionally establishes the
/// one-row COMPLETE placement window with an end condition; the point performs no directory lookup. The one
/// `PaidResult` log carries the concrete observations, not only a digest.

/// The joined QUOTE/Pair consumer (sdk-fixture steps 5–7): point read under an ordered lens or
/// under the no-tiebreak policy, a complete folder page, a tag-filtered page, an as-of history
/// read at an explicit basis, and the label-retention retrieval. It imports no candidate library
/// (no Keys): every id it needs is a call argument or a public getter result. The point read verifies the
/// selected record's Type and 160-byte shape, that its Pair reference is a PAIR record whose two
/// leading words are ITEM records, and that the head admission's publication evidence names the
/// lens principal that was selected with a known proof kind (1 native, 2 signed).
contract JoinedConsumer {
    bytes32 public constant HEAD = keccak256("efs2/purpose/head/1");
    bytes32 public constant FOLDER = keccak256("efs2/purpose/folder/1");
    bytes32 public constant TAG = keccak256("efs2/purpose/tag/1");
    bytes32 public constant KIND_POINT = keccak256("joined/point");
    bytes32 public constant KIND_LIST = keccak256("joined/list");
    bytes32 public constant KIND_LIST_TAGGED = keccak256("joined/list-tagged");
    bytes32 public constant KIND_HISTORY = keccak256("joined/history");
    bytes32 public constant KIND_LABEL = keccak256("joined/label");
    uint256 public constant QUOTE_BODY = 160;
    // mirrors of LensReader's status vocabulary (kept local to avoid extra calls)
    uint8 private constant FOUND = 1;
    uint8 private constant COMPLETE = 2;
    uint8 private constant H_FOUND = 2;

    ILedgerReads public immutable ledger; // the Ledger's public read ABI (consumer-local interface; a test may substitute a faulty reader)
    ILensReads public immutable lens; // the LensReader's public read ABI (same)
    bytes32 public immutable quoteType; // QUOTE_J
    bytes32 public immutable pairType; // PAIR
    bytes32 public immutable itemType; // ITEM
    bytes32 public immutable labelType; // LABEL

    event ResultCommitment(bytes32 indexed kind, bytes32 commitment, bytes32 evidenceCommitment);

    error NoSelection(uint8 status);
    error Conflict(uint8 status, uint256 liveCandidates);
    error QuoteShape(bytes32 target, bytes32 typeId, uint256 length);
    error PairShape(bytes32 pairId, bytes32 typeId, uint256 length);
    error ItemShape(bytes32 itemId, bytes32 typeId);
    error AuthorMismatch(address selected, address evidenceAuthor, uint8 proofKind);
    error PageNotComplete(uint8 status, bool mutated);
    error HistoryUnavailable(uint8 status);
    error LabelUnavailable(bytes32 position, bytes32 role);
    error LabelIntegrity(bytes32 role, bytes32 bodyHash);

    struct Quote {
        bytes32 pairId;
        uint256 mantissa;
        uint8 scale;
        uint64 observedAt;
        bytes32 note;
        bytes32 itemA;
        bytes32 itemB;
    }

    constructor(ILedgerReads ledger_, ILensReads lens_, bytes32 quoteType_, bytes32 pairType_, bytes32 itemType_, bytes32 labelType_) {
        ledger = ledger_;
        lens = lens_;
        quoteType = quoteType_;
        pairType = pairType_;
        itemType = itemType_;
        labelType = labelType_;
    }

    // ------------------------------------------------------------------ point reads
    /// Ordered lens: the first principal with a binding decides (LensReader.resolve).
    /// commitment = keccak256(abi.encode(pairId, mantissa, scale, authorKind, lensId, basis))
    /// evidence   = keccak256(abi.encode(itemA, itemB, observedAt, note, author, publication, admission, revision, target))
    function readPoint(address[] calldata lensPrincipals, bytes32 subject)
        external
        returns (bytes32 commitment, bytes32 evidenceCommitment)
    {
        (uint8 status, bytes32 target, uint32 revision, address author, uint64 admission) =
            lens.resolve(lensPrincipals, HEAD, subject, bytes32(0));
        if (status != FOUND) revert NoSelection(status);
        return _commitPoint(lensPrincipals, target, revision, author, admission);
    }

    /// Agreement policy (LENS_NO_TIEBREAK): more than one live candidate, or a live next to a
    /// removal, is CONFLICT and reverts; no incidental-order winner is exposed.
    function readPointNoTiebreak(address[] calldata lensPrincipals, bytes32 subject)
        external
        returns (bytes32 commitment, bytes32 evidenceCommitment)
    {
        (uint8 status, LensReader.Entry[] memory candidates) = lens.resolveNoTiebreak(lensPrincipals, HEAD, subject, bytes32(0));
        if (status != FOUND) revert Conflict(status, candidates.length);
        LensReader.Entry memory c = candidates[0];
        return _commitPoint(lensPrincipals, c.target, c.revision, c.author, c.admission);
    }

    function _commitPoint(address[] calldata lensPrincipals, bytes32 target, uint32 revision, address author, uint64 admission)
        private
        returns (bytes32 commitment, bytes32 evidenceCommitment)
    {
        Quote memory q = _quote(target);
        (uint8 kind, address evidenceAuthor, uint64 publication) = _authorOf(admission);
        if (evidenceAuthor != author) revert AuthorMismatch(author, evidenceAuthor, kind);
        uint64 basis = _basis();
        commitment = keccak256(abi.encode(q.pairId, q.mantissa, q.scale, kind, _lensId(lensPrincipals), basis));
        evidenceCommitment =
            keccak256(abi.encode(q.itemA, q.itemB, q.observedAt, q.note, author, publication, admission, revision, target));
        emit ResultCommitment(KIND_POINT, commitment, evidenceCommitment);
    }

    // ------------------------------------------------------------------ listing
    /// One complete folder page from a fresh cursor. PARTIAL, UNKNOWN or mixed-basis (mutated)
    /// pages revert: an effectful consumer must not act on them.
    /// commitment = keccak256(abi.encode(keccak256(abi.encode(items)), selectedSoFar, lensId, basisAdmission))
    function readList(address[] calldata lensPrincipals, bytes32 folder, uint256 budget)
        external
        returns (bytes32 commitment, bytes32 evidenceCommitment)
    {
        LensReader.Page memory page = _completePage(lensPrincipals, FOLDER, folder, budget);
        commitment = keccak256(
            abi.encode(keccak256(abi.encode(page.items)), page.selectedSoFar, _lensId(lensPrincipals), page.next.basisAdmission)
        );
        evidenceCommitment = keccak256(
            abi.encode(
                page.scanned, page.hydrations, page.rawTotal, page.next.indexGeneration, page.next.rulesEpoch, page.next.coreCodeCommitment
            )
        );
        emit ResultCommitment(KIND_LIST, commitment, evidenceCommitment);
    }

    /// Tag filtering AFTER lens selection: every selected entry of the folder page is kept iff the
    /// same lens finds a live (TAG, subject, concept) binding on its target.
    /// commitment = keccak256(abi.encode(keccak256(abi.encode(taggedTargets)), count, concept, lensId, basisAdmission))
    function readListTagged(address[] calldata lensPrincipals, bytes32 folder, bytes32 concept, uint256 budget)
        external
        returns (bytes32 commitment, bytes32 evidenceCommitment)
    {
        LensReader.Page memory page = _completePage(lensPrincipals, FOLDER, folder, budget);
        bytes32[] memory tagged = new bytes32[](page.items.length);
        uint256 n;
        for (uint256 i; i < page.items.length; ++i) {
            (uint8 st,,,,) = lens.resolve(lensPrincipals, TAG, page.items[i].target, concept);
            if (st == FOUND) tagged[n++] = page.items[i].target;
        }
        assembly ("memory-safe") {
            mstore(tagged, n)
        }
        commitment =
            keccak256(abi.encode(keccak256(abi.encode(tagged)), n, concept, _lensId(lensPrincipals), page.next.basisAdmission));
        evidenceCommitment = keccak256(abi.encode(page.selectedSoFar, page.scanned, page.hydrations, page.items.length));
        emit ResultCommitment(KIND_LIST_TAGGED, commitment, evidenceCommitment);
    }

    function _completePage(address[] calldata lensPrincipals, bytes32 purpose, bytes32 subject, uint256 budget)
        private
        view
        returns (LensReader.Page memory page)
    {
        LensReader.Cursor memory fresh;
        page = lens.list(lensPrincipals, purpose, subject, fresh, budget);
        if (page.status != COMPLETE || page.mutated) revert PageNotComplete(page.status, page.mutated);
    }

    // ------------------------------------------------------------------ as-of history
    /// The author's head at (purpose, subject, role) as of an explicit admission ordinal — an OLDER
    /// basis is a strictly older revision, not the latest. When the position is a HEAD and the
    /// retained revision is live, the older quote is verified like a point read.
    /// commitment = keccak256(abi.encode(live, target, revision, admission, asOf, author, basis))
    /// evidence   = keccak256(abi.encode(pairId, mantissa, scale, itemA, itemB)) for a live HEAD, else 0
    function readHistoryAsOf(address author, bytes32 purpose, bytes32 subject, bytes32 role, uint64 asOf)
        external
        returns (bytes32 commitment, bytes32 evidenceCommitment)
    {
        (uint8 status, bool live, bytes32 target, uint32 revision, uint64 admission) =
            lens.historyByRole(author, purpose, subject, role, asOf);
        if (status != H_FOUND) revert HistoryUnavailable(status);
        commitment = keccak256(abi.encode(live, target, revision, admission, asOf, author, _basis()));
        if (live && purpose == HEAD) {
            Quote memory q = _quote(target);
            evidenceCommitment = keccak256(abi.encode(q.pairId, q.mantissa, q.scale, q.itemA, q.itemB));
        }
        emit ResultCommitment(KIND_HISTORY, commitment, evidenceCommitment);
    }

    // ------------------------------------------------------------------ label retention (client convention, not Files semantics)
    /// Display-label mapping of the label probe, stated explicitly: only a FOLDER-purpose position
    /// carries a name, and the name is the exact bytes of the LABEL Record whose id is derived from
    /// the position's role (role == keccak256(bytes)). HEAD positions (role 0) carry no label; tag
    /// concepts and folder ids are NOT resolved here. Missing bytes revert LabelUnavailable — never
    /// an empty name. The bytes are self-certifying (keccak256(bytes) == role).
    /// `labelRecordId` is supplied by the caller (a cold reader derives it from the role with its own
    /// formula); this consumer imports no candidate library and does not derive it. The supplied id
    /// cannot substitute bytes: the record must carry the LABEL Type and its bytes must hash to the
    /// position's role, else LabelUnavailable / LabelIntegrity.
    /// commitment = keccak256(abi.encode(position, role, bytes))
    /// evidence   = keccak256(abi.encode(folderId, labelRecordId, firstAdmission, occurrences, length))
    function readLabel(bytes32 position, bytes32 labelRecordId) external returns (bytes32 commitment, bytes32 evidenceCommitment) {
        (bytes32 purpose, bytes32 folderId, bytes32 role) = ledger.positionCell(position);
        if (purpose != FOLDER || role == bytes32(0)) revert LabelUnavailable(position, role);
        (bytes32 typeId, uint64 firstAdmission, uint32 occurrences, bytes memory data) = ledger.record(labelRecordId);
        if (typeId != labelType) revert LabelUnavailable(position, role);
        bytes32 h = keccak256(data);
        if (h != role) revert LabelIntegrity(role, h);
        commitment = keccak256(abi.encode(position, role, data));
        evidenceCommitment = keccak256(abi.encode(folderId, labelRecordId, firstAdmission, occurrences, data.length));
        emit ResultCommitment(KIND_LABEL, commitment, evidenceCommitment);
    }

    // ------------------------------------------------------------------ the sealed paid point/list slice (sdk-fixture appendix)
    bytes32 public constant KIND_PAID_POINT = keccak256("paid/point");
    bytes32 public constant KIND_PAID_LIST = keccak256("paid/list");
    uint8 public constant PROOF_CONTRACT_ORIGINATED = 1; // evidence category CONTRACT_ORIGINATED_PUBLICATION: no EOA signature exists
    uint8 public constant PROOF_EOA_SIGNED = 2; // evidence category EOA_SIGNED_PUBLICATION
    uint8 private constant ACTION_BIND = 3;

    /// Semantic expectations of one paid row (the same struct for point and list): the selected content and the
    /// exact arm-local observation basis. Supplied by the run controller from its sealed manifest, never derived here.
    struct Expect {
        bytes32 subject; // FILE_QUOTE (physical subject id from the sealed fixture map)
        bytes32 expectedHead; // QUOTE_A2 (A-first) / QUOTE_B1 (B-first): the expected selected head record id — an INPUT from the sealed fixture map, never derived here
        address selectedAuthor; // the lens principal expected to hold the selected HEAD (AUTHOR_A or AUTHOR_B)
        uint8 selectedProofKind; // PROOF_EOA_SIGNED (A-first) or PROOF_CONTRACT_ORIGINATED (B-first)
        bytes32 pairId; // PAIR_ETH_USDC
        bytes32 itemA; // ITEM_ETH: the Pair's first ordered reference
        bytes32 itemB; // ITEM_USDC: the second
        uint256 mantissa; // the selected Quote's exact fixture mantissa
        uint8 scale; // 6
        uint64 observedAt; // the selected Quote's exact observation time from the sealed fixture (an INPUT, compared on chain)
        bytes32 noteCommitment; // keccak256 of the sealed NOTE_BYTES (an INPUT, compared on chain)
        uint64 basisAdmission; // the admission frontier at the post-B1 seal
    }

    /// Expectations of the one placement a list row must find (list rows only).
    struct PlacementExpect {
        bytes32 folder; // /swaps
        bytes32 nameRole; // keccak256("eth-usdc")
        address actor; // AUTHOR_A: whose placement it is
        uint8 proofKind; // PROOF_EOA_SIGNED: category EOA_SIGNED_PUBLICATION_EFFECT
        uint64 publication; // the A1 publication ordinal (sourceStep A1) from the independently retained A1 receipt
        uint256 budget; // candidate budget of the one bounded page
    }

    /// Concrete observations of the content selection (point and list). Physical ids and ordinals only: the
    /// fixture labels (QUOTE_A2 / A2, QUOTE_B1 / B1) are joined by the run controller, never assumed here.
    struct Selection {
        uint64 basisAdmission;
        uint64 indexGeneration;
        uint64 rulesEpoch;
        bytes32 coreCodeCommitment;
        bytes32 lensId;
        bytes32 subject;
        bytes32 selectedHead;
        uint32 selectedRevision;
        uint64 selectedAdmission;
        uint64 selectedPublication;
        address selectedAuthor;
        uint8 selectedProofKind;
        bytes32 pairId;
        bytes32 itemA;
        bytes32 itemB;
        uint256 mantissa;
        uint8 scale;
        uint64 observedAt;
        bytes32 note;
    }

    /// Concrete observations of the placement window (list only; all-zero for a point row).
    struct Placement {
        bytes32 position;
        address actor;
        uint8 proofKind;
        uint32 revision;
        uint64 admission;
        uint64 publication;
        uint64 basisAdmission;
        uint8 pageStatus;
        uint64 rawTotal;
        uint64 scanned;
        uint64 hydrations;
        uint64 selectedSoFar;
        bool mutated;
        bool ended;
    }

    /// The one log of a paid row: the digest AND the concrete observations.
    /// commitment = keccak256(abi.encode(kind, selection, placement))
    event PaidResult(bytes32 indexed kind, bytes32 commitment, Selection selection, Placement placement);

    error BasisMismatch(uint64 expected, uint64 observed);
    error SelectionMismatch(uint8 field, bytes32 expected, bytes32 observed); // field 1 = selected author, 2 = selected head id, 3 = observedAt, 4 = note commitment
    error AdmissionShape(uint64 admission, uint8 kind, bool withdrawn, bytes32 target);
    error EvidenceBounds(uint64 admission, uint64 publication, uint64 firstAdmission, uint16 leafCount);
    error ProofCategory(uint8 expected, uint8 observed);
    error ProofShape(uint8 proofKind, uint8 v, bytes32 r, bytes32 s);
    error ClosureMismatch(uint8 field, bytes32 expected, bytes32 observed);
    error PlacementWindow(uint8 status, uint64 rawTotal, uint64 scanned, uint256 items, bool mutated, bool ended);
    error PlacementMismatch(uint8 field, bytes32 expected, bytes32 observed);

    /// PAID_POINT: File-keyed content selection under the ordered lens, closure-checked at the pinned basis.
    /// No directory lookup is performed or charged.
    function paidPoint(address[] calldata lensPrincipals, Expect calldata e)
        external
        returns (bytes32 commitment, Selection memory selection)
    {
        selection = _select(lensPrincipals, e);
        Placement memory none;
        commitment = keccak256(abi.encode(KIND_PAID_POINT, selection, none));
        emit PaidResult(KIND_PAID_POINT, commitment, selection, none);
    }

    /// PAID_LIST: the one bounded placement window (COMPLETE, ended, exactly one row: no duplicate, no B
    /// placement) and its provenance, then the SAME content selection and closure as the point at the same basis.
    function paidList(address[] calldata lensPrincipals, Expect calldata e, PlacementExpect calldata p)
        external
        returns (bytes32 commitment, Selection memory selection, Placement memory placement)
    {
        placement = _placement(lensPrincipals, e.subject, p);
        selection = _select(lensPrincipals, e);
        if (placement.basisAdmission != selection.basisAdmission) revert BasisMismatch(selection.basisAdmission, placement.basisAdmission);
        commitment = keccak256(abi.encode(KIND_PAID_LIST, selection, placement));
        emit PaidResult(KIND_PAID_LIST, commitment, selection, placement);
    }

    /// The content selection shared by point and list: basis pin, ordered-lens HEAD resolution, the admitting
    /// publication's author / proof category / range bounds, then the Quote -> Pair -> two Items closure.
    function _select(address[] calldata lensPrincipals, Expect calldata e) private view returns (Selection memory s) {
        _pinBasis(s, e.basisAdmission);
        (uint8 status, bytes32 target, uint32 revision, address author, uint64 admission) =
            lens.resolve(lensPrincipals, HEAD, e.subject, bytes32(0));
        if (status != FOUND) revert NoSelection(status);
        if (author != e.selectedAuthor) revert SelectionMismatch(1, bytes32(uint256(uint160(e.selectedAuthor))), bytes32(uint256(uint160(author))));
        if (target != e.expectedHead) revert SelectionMismatch(2, e.expectedHead, target);
        s.lensId = _lensId(lensPrincipals);
        s.subject = e.subject;
        s.selectedHead = target;
        s.selectedRevision = revision;
        s.selectedAdmission = admission;
        s.selectedAuthor = author;
        (s.selectedPublication, s.selectedProofKind) = _admittedBy(admission, target, author, e.selectedProofKind);
        _closure(s, e);
    }

    /// The arm-local observation basis: the admission frontier (pinned exactly — a moved frontier is a mixed
    /// basis and reverts), plus the index generation, rules epoch and Core code commitment a cursor would bind.
    function _pinBasis(Selection memory s, uint64 expected) private view {
        (uint64 admissions,,,) = ledger.counts();
        if (admissions != expected) revert BasisMismatch(expected, admissions);
        s.basisAdmission = admissions;
        s.indexGeneration = IIndexGeneration(lens.index()).generation();
        s.rulesEpoch = IRulesEpoch(ledger.registry()).epoch();
        s.coreCodeCommitment = address(ledger).codehash;
    }

    /// The admission that set the observed head or placement must be a live BIND of exactly that target, inside
    /// the admission range of its publication, whose retained evidence names `author` under the expected proof
    /// category: a contract-originated publication carries no signature at all (nothing fabricated), a signed one
    /// carries (v, r, s).
    function _admittedBy(uint64 admission, bytes32 target, address author, uint8 expectedProofKind)
        private
        view
        returns (uint64 publication, uint8 proofKind)
    {
        (uint8 kind,, uint64 pub,,, bool withdrawn, bytes32 a,) = ledger.admission(admission);
        if (kind != ACTION_BIND || withdrawn || a != target) revert AdmissionShape(admission, kind, withdrawn, a);
        (address evidenceAuthor, uint8 pk, uint8 v, uint16 leafCount, uint64 first, bytes32 r, bytes32 sg,,,,,,) = ledger.evidence(pub);
        if (admission < first || admission >= first + leafCount) revert EvidenceBounds(admission, pub, first, leafCount);
        if (evidenceAuthor != author) revert AuthorMismatch(author, evidenceAuthor, pk);
        if (pk != expectedProofKind) revert ProofCategory(expectedProofKind, pk);
        if (pk == PROOF_CONTRACT_ORIGINATED) {
            if (v != 0 || r != bytes32(0) || sg != bytes32(0)) revert ProofShape(pk, v, r, sg);
        } else if (pk == PROOF_EOA_SIGNED) {
            if (v == 0 || r == bytes32(0) || sg == bytes32(0)) revert ProofShape(pk, v, r, sg);
        } else {
            revert ProofShape(pk, v, r, sg);
        }
        return (pub, pk);
    }

    /// Quote -> Pair -> two Items with exact Types and ordered references (`_quote`), then EVERY sealed Quote field
    /// (pair, ordered items, mantissa, scale, observedAt, note commitment) against the caller's expectation. Item
    /// checks are Type checks only (no Item payload semantics in this slice).
    function _closure(Selection memory s, Expect calldata e) private view {
        Quote memory q = _quote(s.selectedHead);
        if (q.pairId != e.pairId) revert ClosureMismatch(1, e.pairId, q.pairId);
        if (q.itemA != e.itemA) revert ClosureMismatch(2, e.itemA, q.itemA);
        if (q.itemB != e.itemB) revert ClosureMismatch(3, e.itemB, q.itemB);
        if (q.mantissa != e.mantissa) revert ClosureMismatch(4, bytes32(e.mantissa), bytes32(q.mantissa));
        if (q.scale != e.scale) revert ClosureMismatch(5, bytes32(uint256(e.scale)), bytes32(uint256(q.scale)));
        if (q.observedAt != e.observedAt) revert SelectionMismatch(3, bytes32(uint256(e.observedAt)), bytes32(uint256(q.observedAt)));
        if (q.note != e.noteCommitment) revert SelectionMismatch(4, e.noteCommitment, q.note);
        s.pairId = q.pairId;
        s.itemA = q.itemA;
        s.itemB = q.itemB;
        s.mantissa = q.mantissa;
        s.scale = q.scale;
        s.observedAt = q.observedAt;
        s.note = q.note;
    }

    /// The one placement window: one bounded page from a fresh cursor must be COMPLETE, unmixed, ended (every
    /// lens principal's raw list exhausted) and hold exactly one row over exactly one raw candidate. `rawTotal == 1`
    /// asserts exactly ONE raw entry in the whole folder scope (FOLDER, folder) summed over the lens principals —
    /// stronger than "one placement named eth-usdc": any other entry under the folder by any lens principal (a
    /// second name, a duplicate, a tombstone) is refused too. That is correct for the sealed fixture, where the
    /// folder holds exactly the single A placement. The row must be the expected (folder, name) -> subject
    /// placement held by the expected actor and admitted by the expected publication under the expected category.
    function _placement(address[] calldata lensPrincipals, bytes32 subject, PlacementExpect calldata p)
        private
        view
        returns (Placement memory pl)
    {
        LensReader.Cursor memory fresh;
        LensReader.Page memory page = lens.list(lensPrincipals, FOLDER, p.folder, fresh, p.budget);
        bool ended = page.next.lensIndex == lensPrincipals.length && page.next.rawIndex == 0;
        pl.pageStatus = page.status;
        pl.rawTotal = page.rawTotal;
        pl.scanned = page.scanned;
        pl.hydrations = page.hydrations;
        pl.selectedSoFar = page.selectedSoFar;
        pl.mutated = page.mutated;
        pl.ended = ended;
        pl.basisAdmission = page.next.basisAdmission;
        if (page.status != COMPLETE || page.mutated || !ended || page.items.length != 1 || page.rawTotal != 1 || page.selectedSoFar != 1) {
            revert PlacementWindow(page.status, page.rawTotal, page.scanned, page.items.length, page.mutated, ended);
        }
        LensReader.Entry memory it = page.items[0];
        (bytes32 purpose, bytes32 folder, bytes32 role) = ledger.positionCell(it.position);
        if (purpose != FOLDER || folder != p.folder) revert PlacementMismatch(1, p.folder, folder);
        if (role != p.nameRole) revert PlacementMismatch(2, p.nameRole, role);
        if (it.target != subject) revert PlacementMismatch(3, subject, it.target);
        if (it.author != p.actor) revert PlacementMismatch(4, bytes32(uint256(uint160(p.actor))), bytes32(uint256(uint160(it.author))));
        (uint64 publication, uint8 proofKind) = _admittedBy(it.admission, it.target, it.author, p.proofKind);
        if (publication != p.publication) revert PlacementMismatch(5, bytes32(uint256(p.publication)), bytes32(uint256(publication)));
        pl.position = it.position;
        pl.actor = it.author;
        pl.proofKind = proofKind;
        pl.revision = it.revision;
        pl.admission = it.admission;
        pl.publication = publication;
    }

    // ------------------------------------------------------------------ verification helpers (public interfaces only)
    function _quote(bytes32 target) private view returns (Quote memory q) {
        (bytes32 typeId,,, bytes memory data) = ledger.record(target);
        if (typeId != quoteType || data.length != QUOTE_BODY) revert QuoteShape(target, typeId, data.length);
        (q.pairId, q.mantissa, q.scale, q.observedAt, q.note) = abi.decode(data, (bytes32, uint256, uint8, uint64, bytes32));
        (bytes32 pairTypeId,,, bytes memory pair) = ledger.record(q.pairId);
        if (pairTypeId != pairType || pair.length < 64) revert PairShape(q.pairId, pairTypeId, pair.length);
        bytes32 a;
        bytes32 b;
        assembly ("memory-safe") {
            a := mload(add(pair, 32))
            b := mload(add(pair, 64))
        }
        (bytes32 ta,,,) = ledger.record(a);
        if (ta != itemType) revert ItemShape(a, ta);
        (bytes32 tb,,,) = ledger.record(b);
        if (tb != itemType) revert ItemShape(b, tb);
        q.itemA = a;
        q.itemB = b;
    }

    /// The publication that admitted `admission`, and its retained author and proof kind.
    function _authorOf(uint64 admission) private view returns (uint8 proofKind, address author, uint64 publication) {
        (,, publication,,,,,) = ledger.admission(admission);
        (author, proofKind,,,,,,,,,,,) = ledger.evidence(publication);
        if (proofKind != 1 && proofKind != 2) revert AuthorMismatch(address(0), author, proofKind);
    }

    /// The admission frontier at execution: the same basis a LensReader cursor pins.
    function _basis() private view returns (uint64 admissions) {
        (admissions,,,) = ledger.counts();
    }

    /// lensId = keccak256(abi.encode(address[])) — standard ABI encoding, not packed.
    function _lensId(address[] calldata lensPrincipals) private pure returns (bytes32) {
        return keccak256(abi.encode(lensPrincipals));
    }
}

/// Stateless twin of `LabHarness.Consumer` for the 32-byte / 41-byte diagnostic cells: the same
/// reads, but each commits to EXACTLY the tuple the storing Consumer would store (same field
/// order and types), so `keccak256(abi.encode(consumer.lastStatus(), ...))` equals the returned
/// commitment. Method names differ from Consumer's on purpose (distinct selectors), so an
/// independent checker keyed on Consumer's selectors never confuses the two surfaces.
contract StatelessConsumer {
    bytes32 public constant KIND_QUOTE = keccak256("stateless/quote");
    bytes32 public constant KIND_HEAD = keccak256("stateless/head");
    bytes32 public constant KIND_LIST = keccak256("stateless/list");
    bytes32 public constant KIND_HISTORY = keccak256("stateless/history");

    LensReader public immutable lens;

    event ResultCommitment(bytes32 indexed kind, bytes32 commitment);

    constructor(LensReader lens_) {
        lens = lens_;
    }

    /// keccak256(abi.encode(uint8 status, bytes32 target, uint32 revision, uint64 admission, uint256 value))
    function commitQuote(address[] calldata lensPrincipals, bytes32 purpose, bytes32 subject, bytes32 role)
        external
        returns (bytes32 commitment)
    {
        (uint8 status, bytes32 target, uint32 revision,, uint64 admission) = lens.resolve(lensPrincipals, purpose, subject, role);
        require(status == 1, "consumer: not selected");
        bytes memory data = lens.body(target);
        require(data.length == 32, "consumer: shape");
        uint256 value = abi.decode(data, (uint256));
        commitment = keccak256(abi.encode(status, target, revision, admission, value));
        emit ResultCommitment(KIND_QUOTE, commitment);
    }

    /// keccak256(abi.encode(uint8 status, bytes32 target, uint32 revision, uint64 admission))
    function commitHead(address[] calldata lensPrincipals, bytes32 purpose, bytes32 subject, bytes32 role)
        external
        returns (bytes32 commitment)
    {
        (uint8 status, bytes32 target, uint32 revision,, uint64 admission) = lens.resolve(lensPrincipals, purpose, subject, role);
        commitment = keccak256(abi.encode(status, target, revision, admission));
        emit ResultCommitment(KIND_HEAD, commitment);
    }

    /// keccak256(abi.encode(uint8 status, uint64 selectedSoFar, uint64 scanned))
    function commitList(address[] calldata lensPrincipals, bytes32 purpose, bytes32 subject, uint256 budget)
        external
        returns (bytes32 commitment)
    {
        LensReader.Cursor memory fresh;
        LensReader.Page memory page = lens.list(lensPrincipals, purpose, subject, fresh, budget);
        commitment = keccak256(abi.encode(page.status, page.selectedSoFar, page.scanned));
        emit ResultCommitment(KIND_LIST, commitment);
    }

    /// keccak256(abi.encode(uint8 live ? 1 : 0, bytes32 target, uint32 revision, uint64 admission))
    function commitHistory(address author, bytes32 position, uint64 asOf) external returns (bytes32 commitment) {
        (uint8 status, bool live, bytes32 target, uint32 revision, uint64 admission) = lens.history(author, position, asOf);
        require(status == 2, "consumer: no history");
        uint8 liveFlag = live ? 1 : 0;
        commitment = keccak256(abi.encode(liveFlag, target, revision, admission));
        emit ResultCommitment(KIND_HISTORY, commitment);
    }
}
