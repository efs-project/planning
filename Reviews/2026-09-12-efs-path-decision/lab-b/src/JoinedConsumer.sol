// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Keys} from "./Keys.sol";
import {Ledger} from "./Ledger.sol";
import {LensReader} from "./LensReader.sol";

/// TEST-ONLY MEASUREMENT CONSUMERS. DISPOSABLE LAB, NO PROTOCOL CLAIM. UNRUN (written under
/// another worker's compiler lease).
///
/// Both contracts are STATELESS: no method writes storage (no SSTORE), so a receipt's gas is the
/// paid-read budget WITHOUT the storage-write component that `LabHarness.Consumer` carries in its
/// `last*` slots. Each paid method returns explicit result commitments (keccak256 over the facts a
/// consumer would act on) and emits them in one `ResultCommitment` log so the retained receipt
/// carries what the transaction computed. That log is the only overhead beyond the read itself
/// (one LOG2 of 32 or 64 bytes: ESTIMATED ~1.5–1.9k gas; not storage) and the measurement labels
/// it. Nothing here is privileged, cached, seeded or read from private storage: every fact comes
/// through the LensReader / Ledger public interfaces, and every non-selected, conflicting,
/// unknown, malformed or partial outcome REVERTS instead of exposing a fabricated value.
///
/// The commitments are candidate-side observables. The measurement script recomputes their
/// expected values from the fixture; that comparison is a self-check, not the independent oracle.

/// The joined QUOTE/Pair consumer (sdk-fixture steps 5–7): point read under an ordered lens or
/// under the no-tiebreak policy, a complete folder page, a tag-filtered page, an as-of history
/// read at an explicit basis, and the label-retention retrieval. The point read verifies the
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

    Ledger public immutable ledger;
    LensReader public immutable lens;
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

    constructor(Ledger ledger_, LensReader lens_, bytes32 quoteType_, bytes32 pairType_, bytes32 itemType_, bytes32 labelType_) {
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
    /// commitment = keccak256(abi.encode(position, role, bytes))
    /// evidence   = keccak256(abi.encode(folderId, recordId, firstAdmission, occurrences, length))
    function readLabel(bytes32 position) external returns (bytes32 commitment, bytes32 evidenceCommitment) {
        (bytes32 purpose, bytes32 folderId, bytes32 role) = ledger.positionCell(position);
        if (purpose != FOLDER || role == bytes32(0)) revert LabelUnavailable(position, role);
        bytes32 id = Keys.recordFromHash(labelType, role);
        (bytes32 typeId, uint64 firstAdmission, uint32 occurrences, bytes memory data) = ledger.record(id);
        if (typeId != labelType) revert LabelUnavailable(position, role);
        bytes32 h = keccak256(data);
        if (h != role) revert LabelIntegrity(role, h);
        commitment = keccak256(abi.encode(position, role, data));
        evidenceCommitment = keccak256(abi.encode(folderId, id, firstAdmission, occurrences, data.length));
        emit ResultCommitment(KIND_LABEL, commitment, evidenceCommitment);
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
