// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract LensStore {
    struct SlotSummary {
        bytes32 claimId;
        bytes32 targetId;
        uint256 meta;
    }

    mapping(bytes32 => SlotSummary) private _slots;
    mapping(bytes32 => uint64[]) private _ordinalClaimants;
    mapping(bytes32 => bytes32[]) private _identityClaimants;
    mapping(bytes32 => mapping(uint64 => uint64[])) private _childrenByAuthor;

    function setSlot(bytes32 slotId, bytes32 claimId, bytes32 targetId, bool active) external {
        _slots[slotId] = SlotSummary(claimId, targetId, active ? 1 : 0);
    }

    function appendClaimant(bytes32 position, uint64 ordinal, bytes32 identity) external {
        _ordinalClaimants[position].push(ordinal);
        _identityClaimants[position].push(identity);
    }

    function appendAuthorChild(bytes32 parent, uint64 ordinal, uint64 child) external {
        _childrenByAuthor[parent][ordinal].push(child);
    }

    // Models the current rich getSlot-style ABI: three distinct storage words are returned.
    function getSlotSummary(bytes32 slotId) external view returns (bytes32, bytes32, uint256) {
        SlotSummary storage s = _slots[slotId];
        return (s.claimId, s.targetId, s.meta);
    }

    // Models a proposed two-phase, packed slot-head read.
    function getSlotHead(bytes32 slotId) external view returns (bytes32) {
        return _slots[slotId].claimId;
    }

    function claimantCount(bytes32 position) external view returns (uint256) {
        return _ordinalClaimants[position].length;
    }

    function claimantOrdinal(bytes32 position, uint256 i) external view returns (uint64) {
        return _ordinalClaimants[position][i];
    }

    function claimantIdentity(bytes32 position, uint256 i) external view returns (bytes32) {
        return _identityClaimants[position][i];
    }

    function authorChildCount(bytes32 parent, uint64 ordinal) external view returns (uint256) {
        return _childrenByAuthor[parent][ordinal].length;
    }

    function authorChild(bytes32 parent, uint64 ordinal, uint256 i) external view returns (uint64) {
        return _childrenByAuthor[parent][ordinal][i];
    }
}

contract LensResolver {
    LensStore public immutable store;

    bytes32 internal constant DOMAIN_SLOT = keccak256("efs.id.slot.v1");
    bytes32 internal constant ROLE_PIN = keccak256("efs.claimrole.pin.v1");
    bytes32 internal constant WORD2 = keccak256("efs.bench.targetkind.data");

    constructor(LensStore s) {
        store = s;
    }

    function slotId(bytes32 identity, bytes32 position) public pure returns (bytes32) {
        return keccak256(abi.encode(DOMAIN_SLOT, ROLE_PIN, identity, position, WORD2));
    }

    function naiveRich(bytes32[] calldata positions, bytes32[] calldata lens)
        external
        view
        returns (bytes32 checksum)
    {
        for (uint256 i; i < positions.length; ++i) {
            for (uint256 r; r < lens.length; ++r) {
                (bytes32 claimId, bytes32 targetId, uint256 meta) = store.getSlotSummary(slotId(lens[r], positions[i]));
                checksum = keccak256(abi.encodePacked(checksum, claimId));
                if (claimId != 0 && (meta & 1) != 0) {
                    checksum = keccak256(abi.encodePacked(checksum, targetId, r));
                    break;
                }
            }
        }
    }

    function naiveTwoPhase(bytes32[] calldata positions, bytes32[] calldata lens)
        external
        view
        returns (bytes32 checksum)
    {
        for (uint256 i; i < positions.length; ++i) {
            for (uint256 r; r < lens.length; ++r) {
                bytes32 sid = slotId(lens[r], positions[i]);
                bytes32 head = store.getSlotHead(sid);
                checksum = keccak256(abi.encodePacked(checksum, head));
                if (head != 0) {
                    (bytes32 claimId, bytes32 targetId, uint256 meta) = store.getSlotSummary(sid);
                    if ((meta & 1) != 0) {
                        checksum = keccak256(abi.encodePacked(checksum, claimId, targetId, r));
                        break;
                    }
                }
            }
        }
    }

    function hybridOrdinals(
        bytes32[] calldata positions,
        bytes32[] calldata lensPriority,
        uint64[] calldata sortedOrdinals,
        uint16[] calldata ranksBySortedOrdinal
    ) external view returns (bytes32 checksum) {
        for (uint256 i; i < positions.length; ++i) {
            (uint256 rank, bytes32 claimId, bytes32 targetId) =
                _resolveOrdinal(positions[i], lensPriority, sortedOrdinals, ranksBySortedOrdinal);
            checksum = keccak256(abi.encodePacked(checksum, rank, claimId, targetId));
        }
    }

    function hybridFullIdentities(
        bytes32[] calldata positions,
        bytes32[] calldata lensPriority,
        bytes32[] calldata sortedIdentities,
        uint16[] calldata ranksBySortedIdentity
    ) external view returns (bytes32 checksum) {
        for (uint256 i; i < positions.length; ++i) {
            (uint256 rank, bytes32 claimId, bytes32 targetId) =
                _resolveIdentity(positions[i], lensPriority, sortedIdentities, ranksBySortedIdentity);
            checksum = keccak256(abi.encodePacked(checksum, rank, claimId, targetId));
        }
    }

    // Scans every author stream and proves duplicates are emitted exactly once. This is the
    // intentionally pessimistic full-enumeration variant; a page normally stops at its limit.
    function authorStreamsAll(
        bytes32 parent,
        bytes32[] calldata lensPriority,
        uint64[] calldata sortedOrdinals,
        uint16[] calldata ranksBySortedOrdinal
    ) external view returns (uint256 emitted, bytes32 checksum) {
        for (uint256 r; r < lensPriority.length; ++r) {
            uint64 ordinal = uint64(r + 1);
            uint256 n = store.authorChildCount(parent, ordinal);
            for (uint256 j; j < n; ++j) {
                bytes32 position = bytes32(uint256(store.authorChild(parent, ordinal, j)));
                (uint256 winnerRank, bytes32 claimId, bytes32 targetId) =
                    _resolveOrdinal(position, lensPriority, sortedOrdinals, ranksBySortedOrdinal);
                if (winnerRank == r) {
                    ++emitted;
                    checksum = keccak256(abi.encodePacked(checksum, position, claimId, targetId));
                }
            }
        }
    }

    // Priority-ordered page: stops when the requested number of unique winners is emitted, so
    // lower-priority duplicate streams are not touched for this page.
    function authorStreamsPage(
        bytes32 parent,
        uint256 limit,
        bytes32[] calldata lensPriority,
        uint64[] calldata sortedOrdinals,
        uint16[] calldata ranksBySortedOrdinal
    ) external view returns (uint256 emitted, bytes32 checksum) {
        for (uint256 r; r < lensPriority.length && emitted < limit; ++r) {
            uint64 ordinal = uint64(r + 1);
            uint256 n = store.authorChildCount(parent, ordinal);
            for (uint256 j; j < n && emitted < limit; ++j) {
                bytes32 position = bytes32(uint256(store.authorChild(parent, ordinal, j)));
                (uint256 winnerRank, bytes32 claimId, bytes32 targetId) =
                    _resolveOrdinal(position, lensPriority, sortedOrdinals, ranksBySortedOrdinal);
                if (winnerRank == r) {
                    ++emitted;
                    checksum = keccak256(abi.encodePacked(checksum, position, claimId, targetId));
                }
            }
        }
    }

    function _resolveOrdinal(
        bytes32 position,
        bytes32[] calldata lensPriority,
        uint64[] calldata sortedOrdinals,
        uint16[] calldata ranksBySortedOrdinal
    ) internal view returns (uint256 winnerRank, bytes32 winnerClaim, bytes32 winnerTarget) {
        uint256 p = store.claimantCount(position);
        if (p >= lensPriority.length) return _direct(position, lensPriority);

        winnerRank = type(uint256).max;
        for (uint256 i; i < p; ++i) {
            uint64 candidate = store.claimantOrdinal(position, i);
            (bool found, uint256 sortedIndex) = _findOrdinal(sortedOrdinals, candidate);
            if (!found) continue;
            uint256 rank = ranksBySortedOrdinal[sortedIndex];
            if (rank >= winnerRank) continue;
            bytes32 sid = slotId(lensPriority[rank], position);
            (bytes32 claimId, bytes32 targetId, uint256 meta) = store.getSlotSummary(sid);
            if (claimId != 0 && (meta & 1) != 0) {
                winnerRank = rank;
                winnerClaim = claimId;
                winnerTarget = targetId;
            }
        }
    }

    function _resolveIdentity(
        bytes32 position,
        bytes32[] calldata lensPriority,
        bytes32[] calldata sortedIdentities,
        uint16[] calldata ranksBySortedIdentity
    ) internal view returns (uint256 winnerRank, bytes32 winnerClaim, bytes32 winnerTarget) {
        uint256 p = store.claimantCount(position);
        if (p >= lensPriority.length) return _direct(position, lensPriority);

        winnerRank = type(uint256).max;
        for (uint256 i; i < p; ++i) {
            bytes32 candidate = store.claimantIdentity(position, i);
            (bool found, uint256 sortedIndex) = _findIdentity(sortedIdentities, candidate);
            if (!found) continue;
            uint256 rank = ranksBySortedIdentity[sortedIndex];
            if (rank >= winnerRank) continue;
            bytes32 sid = slotId(lensPriority[rank], position);
            (bytes32 claimId, bytes32 targetId, uint256 meta) = store.getSlotSummary(sid);
            if (claimId != 0 && (meta & 1) != 0) {
                winnerRank = rank;
                winnerClaim = claimId;
                winnerTarget = targetId;
            }
        }
    }

    function _direct(bytes32 position, bytes32[] calldata lensPriority)
        internal
        view
        returns (uint256 rank, bytes32 claimId, bytes32 targetId)
    {
        rank = type(uint256).max;
        for (uint256 r; r < lensPriority.length; ++r) {
            (bytes32 c, bytes32 t, uint256 meta) = store.getSlotSummary(slotId(lensPriority[r], position));
            if (c != 0 && (meta & 1) != 0) return (r, c, t);
        }
    }

    function _findOrdinal(uint64[] calldata sorted, uint64 needle) internal pure returns (bool, uint256) {
        uint256 lo;
        uint256 hi = sorted.length;
        while (lo < hi) {
            uint256 mid = (lo + hi) >> 1;
            uint64 v = sorted[mid];
            if (v < needle) lo = mid + 1;
            else hi = mid;
        }
        return (lo < sorted.length && sorted[lo] == needle, lo);
    }

    function _findIdentity(bytes32[] calldata sorted, bytes32 needle) internal pure returns (bool, uint256) {
        uint256 lo;
        uint256 hi = sorted.length;
        while (lo < hi) {
            uint256 mid = (lo + hi) >> 1;
            bytes32 v = sorted[mid];
            if (uint256(v) < uint256(needle)) lo = mid + 1;
            else hi = mid;
        }
        return (lo < sorted.length && sorted[lo] == needle, lo);
    }
}

contract LensGasTest {
    event log_named_uint(string key, uint256 val);

    LensStore internal store;
    LensResolver internal resolver;

    bytes32 internal constant PARENT = keccak256("efs.bench.parent");
    bytes32 internal constant PARENT20 = keccak256("efs.bench.parent20");

    function setUp() public {
        store = new LensStore();
        resolver = new LensResolver(store);

        // Naive corpus: 64 positions, only rank 99 has a live value. K=50 therefore proves
        // complete absence; K=100 finds the final author. Both are worst-case K probes.
        for (uint256 p = 1; p <= 64; ++p) {
            bytes32 position = bytes32(p);
            bytes32 author = _author(99);
            store.setSlot(resolver.slotId(author, position), bytes32(10_000 + p), bytes32(20_000 + p), true);
        }

        // Hybrid corpus: two live claimants at ranks 10 and 40, and two author streams carrying
        // every child. Rank 10 is the first-attester winner.
        for (uint256 p = 1_001; p <= 1_064; ++p) {
            bytes32 position = bytes32(p);
            for (uint256 rIndex; rIndex < 2; ++rIndex) {
                uint256 rank = rIndex == 0 ? 10 : 40;
                bytes32 author = _author(rank);
                store.appendClaimant(position, uint64(rank + 1), author);
                store.setSlot(
                    resolver.slotId(author, position),
                    bytes32(30_000 + p + rank),
                    bytes32(40_000 + p + rank),
                    true
                );
                store.appendAuthorChild(PARENT, uint64(rank + 1), uint64(p));
                if (p <= 1_020) store.appendAuthorChild(PARENT20, uint64(rank + 1), uint64(p));
            }
        }
    }

    function testGas_naiveRich_K50_M20() public { _measureNaiveRich(50, 20); }
    function testGas_naiveRich_K50_M64() public { _measureNaiveRich(50, 64); }
    function testGas_naiveRich_K100_M20() public { _measureNaiveRich(100, 20); }
    function testGas_naiveRich_K100_M64() public { _measureNaiveRich(100, 64); }
    function testGas_naiveRichMatchedP2_K50_M64() public { _measureNaiveRichMatched(50, 64); }
    function testGas_naiveRichMatchedP2_K100_M64() public { _measureNaiveRichMatched(100, 64); }
    function testGas_naiveTwoPhase_K50_M20() public { _measureNaiveTwoPhase(50, 20); }
    function testGas_naiveTwoPhase_K50_M64() public { _measureNaiveTwoPhase(50, 64); }
    function testGas_naiveTwoPhase_K100_M20() public { _measureNaiveTwoPhase(100, 20); }
    function testGas_naiveTwoPhase_K100_M64() public { _measureNaiveTwoPhase(100, 64); }
    function testGas_naiveTwoPhaseMatchedP2_K50_M64() public { _measureNaiveTwoPhaseMatched(50, 64); }
    function testGas_naiveTwoPhaseMatchedP2_K100_M64() public { _measureNaiveTwoPhaseMatched(100, 64); }
    function testGas_hybridOrdinal_K50_M20() public { _measureHybridOrdinal(50, 20); }
    function testGas_hybridOrdinal_K50_M64() public { _measureHybridOrdinal(50, 64); }
    function testGas_hybridOrdinal_K100_M20() public { _measureHybridOrdinal(100, 20); }
    function testGas_hybridOrdinal_K100_M64() public { _measureHybridOrdinal(100, 64); }
    function testGas_hybridFull_K50_M64() public { _measureHybridFull(50, 64); }
    function testGas_hybridFull_K100_M64() public { _measureHybridFull(100, 64); }
    function testGas_authorStreamPage_K50_M20() public { _measureAuthorPage(50, 20); }
    function testGas_authorStreamPage_K50_M64() public { _measureAuthorPage(50, 64); }
    function testGas_authorStreamPage_K100_M20() public { _measureAuthorPage(100, 20); }
    function testGas_authorStreamPage_K100_M64() public { _measureAuthorPage(100, 64); }
    function testGas_authorStreamAll_K50_M20() public { _measureAuthorAll(50, 20, PARENT20); }
    function testGas_authorStreamAll_K50_M64() public { _measureAuthorAll(50, 64, PARENT); }
    function testGas_authorStreamAll_K100_M20() public { _measureAuthorAll(100, 20, PARENT20); }
    function testGas_authorStreamAll_K100_M64() public { _measureAuthorAll(100, 64, PARENT); }

    function _measureNaiveRich(uint256 k, uint256 m) internal {
        bytes32[] memory lens = _lens(k);
        bytes32[] memory positions = _positions(1, m);
        uint256 beforeGas = gasleft();
        resolver.naiveRich(positions, lens);
        emit log_named_uint("gas", beforeGas - gasleft());
    }

    function _measureNaiveRichMatched(uint256 k, uint256 m) internal {
        bytes32[] memory lens = _lens(k);
        bytes32[] memory positions = _positions(1_001, m);
        uint256 beforeGas = gasleft();
        resolver.naiveRich(positions, lens);
        emit log_named_uint("gas", beforeGas - gasleft());
    }

    function _measureNaiveTwoPhase(uint256 k, uint256 m) internal {
        bytes32[] memory lens = _lens(k);
        bytes32[] memory positions = _positions(1, m);
        uint256 beforeGas = gasleft();
        resolver.naiveTwoPhase(positions, lens);
        emit log_named_uint("gas", beforeGas - gasleft());
    }

    function _measureNaiveTwoPhaseMatched(uint256 k, uint256 m) internal {
        bytes32[] memory lens = _lens(k);
        bytes32[] memory positions = _positions(1_001, m);
        uint256 beforeGas = gasleft();
        resolver.naiveTwoPhase(positions, lens);
        emit log_named_uint("gas", beforeGas - gasleft());
    }

    function _measureHybridOrdinal(uint256 k, uint256 m) internal {
        bytes32[] memory lens = _lens(k);
        (uint64[] memory ordinals, uint16[] memory ranks) = _ordinalIndex(k);
        bytes32[] memory positions = _positions(1_001, m);
        uint256 beforeGas = gasleft();
        resolver.hybridOrdinals(positions, lens, ordinals, ranks);
        emit log_named_uint("gas", beforeGas - gasleft());
    }

    function _measureHybridFull(uint256 k, uint256 m) internal {
        bytes32[] memory lens = _lens(k);
        (bytes32[] memory sortedIdentities, uint16[] memory ranks) = _identityIndex(lens);
        bytes32[] memory positions = _positions(1_001, m);
        uint256 beforeGas = gasleft();
        resolver.hybridFullIdentities(positions, lens, sortedIdentities, ranks);
        emit log_named_uint("gas", beforeGas - gasleft());
    }

    function _measureAuthorPage(uint256 k, uint256 m) internal {
        bytes32[] memory lens = _lens(k);
        (uint64[] memory ordinals, uint16[] memory ranks) = _ordinalIndex(k);
        uint256 beforeGas = gasleft();
        (uint256 emitted,) = resolver.authorStreamsPage(PARENT, m, lens, ordinals, ranks);
        emit log_named_uint("gas", beforeGas - gasleft());
        require(emitted == m, "wrong emitted");
    }

    function _measureAuthorAll(uint256 k, uint256 m, bytes32 parent) internal {
        bytes32[] memory lens = _lens(k);
        (uint64[] memory ordinals, uint16[] memory ranks) = _ordinalIndex(k);
        uint256 beforeGas = gasleft();
        (uint256 emitted,) = resolver.authorStreamsAll(parent, lens, ordinals, ranks);
        emit log_named_uint("gas", beforeGas - gasleft());
        require(emitted == m, "wrong emitted");
    }

    function _lens(uint256 k) internal pure returns (bytes32[] memory out) {
        out = new bytes32[](k);
        for (uint256 i; i < k; ++i) out[i] = _author(i);
    }

    function _ordinalIndex(uint256 k) internal pure returns (uint64[] memory ords, uint16[] memory ranks) {
        ords = new uint64[](k);
        ranks = new uint16[](k);
        for (uint256 i; i < k; ++i) {
            ords[i] = uint64(i + 1);
            ranks[i] = uint16(i);
        }
    }

    function _identityIndex(bytes32[] memory lens)
        internal
        pure
        returns (bytes32[] memory sorted, uint16[] memory ranks)
    {
        uint256 k = lens.length;
        sorted = new bytes32[](k);
        ranks = new uint16[](k);
        for (uint256 i; i < k; ++i) {
            bytes32 value = lens[i];
            uint16 rank = uint16(i);
            uint256 j = i;
            while (j > 0 && uint256(sorted[j - 1]) > uint256(value)) {
                sorted[j] = sorted[j - 1];
                ranks[j] = ranks[j - 1];
                --j;
            }
            sorted[j] = value;
            ranks[j] = rank;
        }
    }

    function _positions(uint256 first, uint256 m) internal pure returns (bytes32[] memory out) {
        out = new bytes32[](m);
        for (uint256 i; i < m; ++i) out[i] = bytes32(first + i);
    }

    function _author(uint256 rank) internal pure returns (bytes32) {
        // Full-width, digest-shaped identity words; never an address truncation.
        return keccak256(abi.encodePacked("author", rank));
    }
}
