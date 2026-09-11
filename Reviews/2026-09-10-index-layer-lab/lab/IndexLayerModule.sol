// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {StateStore} from "C0Core/StateStore.sol";
import {BindingFold} from "C0Core/BindingFold.sol";
import {IndexKeys} from "C0Core/IndexKeys.sol";
import {StorageByteView} from "C0Core/StorageByteView.sol";
import {StateAuditPages} from "C0Core/StateAuditPages.sol";
import {TypeGroupParser} from "C0Admission/TypeGroupParser.sol";
import {UpgradeStorage} from "Foundation/UpgradeStorage.sol";
import {IndexLayerStorage} from "./IndexLayerStorage.sol";
import {FieldWalk} from "./FieldWalk.sol";

/// @notice Declared-family index layer: declare/attach, chunked backfill,
/// the reverting probe, the bool-free tolerant probe, basis-committing pages,
/// and two-step detach. Reached through the U4 core's fallback (delegatecall),
/// so it operates on the proxy's storage. Disposable lab code.
contract IndexLayerModule {
    using IndexLayerStorage for IndexLayerStorage.Layout;

    enum Tri {
        HIT,
        MISS_COVERED,
        UNCOVERED,
        UNSUPPORTED,
        FROZEN
    }

    struct Coverage {
        bool slot; // a coverage slot exists (pre-declaration scope that has been touched by backfill)
        uint8 state; // COV_NONE | COV_PARTIAL | COV_COMPLETE | COV_FROZEN
        uint64 through; // positions [0, through) backfilled
        uint64 liveFrom; // positions [liveFrom, count) born after declaration (hook-maintained)
        uint32 revision; // coverage revision (bumped per backfill chunk)
        uint64 declaredAt; // d: admission high-water at declaration
        uint64 retiredAt; // 0 unless detached
        uint64 scopeCount; // current kind-10 count
        uint64 highWater; // current admission high-water (basis)
    }

    error Unsupported();
    error NotAPosition(uint64 position, uint64 count);
    error Uncovered(uint64 position, uint64 through, uint64 liveFrom);
    error Frozen(uint64 retiredAt);
    error Guard(uint64 through, uint64 expected);
    error ErrPageCursor(uint256 cursor);
    error ErrPageBasis(uint64 requestedBasis, uint64 currentHighWater);
    error AttachCap(bytes32 typeId);
    error DetachState(uint8 code);
    error WalkIntegrity(uint8 code, uint64 position);

    event FamilyDeclared(bytes32 indexed familyId, uint64 ordinal, bytes32 indexed typeId, uint8 fieldIndex, uint64 declaredAt);
    event Backfilled(bytes32 indexed familyId, bytes32 indexed scopeKey, uint64 through, uint64 liveFrom, uint32 revision, uint8 state);
    event DetachAnnounced(bytes32 indexed familyId, uint64 detachAt);
    event Detached(bytes32 indexed familyId, uint64 retiredAt);

    uint256 private constant U48 = (uint256(1) << 48) - 1;
    uint256 private constant CURSOR_END = type(uint256).max;
    uint256 private constant SCAN_MAX = 8192; // positions inspected per page call (32 words)
    uint64 private constant NONE = type(uint64).max;

    // ---- declaration / attach (lab authority: anyone; Type-level) ----------

    function declare(bytes32 typeId, uint8 fieldIndex)
        external
        returns (bytes32 familyId, uint64 ordinal, uint64 declaredAt)
    {
        StateStore.Store storage s = UpgradeStorage.efs();
        IndexLayerStorage.Layout storage l = IndexLayerStorage.layout();
        StateStore.TypeRow storage t = s.types[typeId];
        if (t.typeOrdinal == 0) revert Unsupported();
        TypeGroupParser.SchemaCache memory sc = abi.decode(t.cacheBytes, (TypeGroupParser.SchemaCache));
        if (sc.typeId != typeId) revert Unsupported();
        uint256 program = FieldWalk.compile(sc, fieldIndex);
        uint256 packedFams = l.typeFamilies[typeId];
        uint256 slot = 8;
        for (uint256 i; i < 8; ++i) {
            if (uint32(packedFams >> (32 * i)) == 0) {
                slot = i;
                break;
            }
        }
        if (slot == 8) revert AttachCap(typeId);
        ordinal = ++l.familyCount;
        declaredAt = s.count.admissions;
        familyId = keccak256(abi.encode(IndexLayerStorage.DOM_FAMILY, typeId, fieldIndex, ordinal, declaredAt));
        l.families[ordinal] =
            IndexLayerStorage.Family(familyId, typeId, program, IndexLayerStorage.packFamily(fieldIndex, 1, declaredAt, 0, 0));
        l.familyOrdinal[familyId] = ordinal;
        l.typeFamilies[typeId] = packedFams | (uint256(ordinal) << (32 * slot)); // attach at declaration
        emit FamilyDeclared(familyId, ordinal, typeId, fieldIndex, declaredAt);
    }

    function setDetachDelay(uint64 delay) external {
        IndexLayerStorage.layout().detachDelay = delay;
    }

    // ---- build: chunked backfill, every bit derived from source records ------

    function backfill(bytes32 familyId, bytes32 scopeKey, uint64 expectedThrough, uint16 maxEntries)
        external
        returns (uint64 through, uint64 liveFrom, uint8 state)
    {
        StateStore.Store storage s = UpgradeStorage.efs();
        IndexLayerStorage.Layout storage l = IndexLayerStorage.layout();
        uint64 ordinal = l.familyOrdinal[familyId];
        if (ordinal == 0) revert Unsupported();
        IndexLayerStorage.Family storage f = l.families[ordinal];
        uint256 fp = f.packed;
        if (IndexLayerStorage.retiredAtOf(fp) != 0) revert Frozen(IndexLayerStorage.retiredAtOf(fp));
        bytes32 k10 = IndexKeys.posting(bytes32(0), 10, 0, scopeKey);
        uint64 count = uint64(s.postings[k10].head);
        bytes32 ck = IndexLayerStorage.coverageKey(ordinal, scopeKey);
        uint256 cov = l.coverage[ck];
        uint32 revision;
        if (cov == 0) {
            // First touch: allocate a slot only for a scope that predates d.
            liveFrom = lowerBound(s, k10, count, IndexLayerStorage.declaredAtOf(fp));
            if (liveFrom == 0) {
                if (expectedThrough != NONE && expectedThrough != 0) revert Guard(0, expectedThrough);
                return (0, 0, IndexLayerStorage.COV_COMPLETE); // born after d: complete by construction, no slot
            }
        } else {
            (through, liveFrom, revision, state) = IndexLayerStorage.unpackCoverage(cov);
        }
        if (expectedThrough != NONE && expectedThrough != through) revert Guard(through, expectedThrough);
        if (state == IndexLayerStorage.COV_COMPLETE) return (through, liveFrom, state);
        uint64 end = through + maxEntries;
        if (end > liveFrom) end = liveFrom;
        bytes32 setType = s.init.bindingSetType;
        bytes32 tombType = s.init.bindingTombstoneType;
        bytes32 famType = f.typeId;
        uint256 program = f.program;
        for (uint64 i = through; i < end; ++i) {
            (bool hit, bytes32 bucket) = derive(s, k10, i, scopeKey, famType, program, setType, tombType);
            if (hit) l.setBit(ordinal, scopeKey, bucket, i);
        }
        through = end;
        ++revision;
        state = through == liveFrom ? IndexLayerStorage.COV_COMPLETE : IndexLayerStorage.COV_PARTIAL;
        l.coverage[ck] = IndexLayerStorage.packCoverage(through, liveFrom, revision, state);
        emit Backfilled(familyId, scopeKey, through, liveFrom, revision, state);
    }

    /// TODAY'S LAYOUT WALK for one scope position (no K10 shortcut):
    /// kind-10 word -> admission row -> envelope bytes (principal, leaf count,
    /// record id word) -> BindingSet/Tombstone record body (purpose, subject,
    /// role) -> binding key -> binding row -> target record type + body -> field.
    function derive(
        StateStore.Store storage s,
        bytes32 k10,
        uint64 position,
        bytes32 scopeKey,
        bytes32 famType,
        uint256 program,
        bytes32 setType,
        bytes32 tombType
    ) private view returns (bool hit, bytes32 bucket) {
        uint64 ord = ordinalAt(s, k10, position);
        if (ord == 0) revert WalkIntegrity(1, position);
        StateStore.AdmissionRow storage a = s.admissions[ord];
        bytes32 envelopeId = a.envelopeId;
        uint16 leaf = uint16(a.packed);
        bytes storage raw = s.envelopes[envelopeId].canonicalUnsignedEnvelope;
        bytes32 principal = bytes32(StorageByteView.word(raw, 32, scopeKey));
        if (leaf >= StorageByteView.word(raw, 224, scopeKey)) revert WalkIntegrity(2, position);
        bytes32 recordId = bytes32(StorageByteView.word(raw, 256 + 32 * uint256(leaf), scopeKey));
        StateStore.RecordRow storage rr = s.records[recordId];
        bytes32 t = rr.typeId;
        if (t != setType && t != tombType) revert WalkIntegrity(3, position);
        bytes32 purpose = bytes32(StorageByteView.word(rr.body, 0, scopeKey));
        bytes32 subject = bytes32(StorageByteView.word(rr.body, 32, scopeKey));
        bytes32 role = bytes32(StorageByteView.word(rr.body, 64, scopeKey));
        if (IndexKeys.scope(principal, purpose, subject) != scopeKey) revert WalkIntegrity(4, position);
        BindingFold.Effect memory e;
        e.purpose = purpose;
        e.subject = subject;
        e.fieldRole = role;
        StateStore.BindingRow storage b = s.bindings[BindingFold.bindingKey(principal, BindingFold.positionKey(e))];
        BindingFold.Head memory h = BindingFold.unpack(b.meta, b.target);
        if (h.state != 1 || h.targetKind != 1) return (false, 0);
        StateStore.RecordRow storage tr = s.records[h.targetA];
        if (tr.typeId != famType) return (false, 0);
        bytes memory body = tr.body;
        return (true, IndexKeys.scalar(FieldWalk.extract(body, program)));
    }

    // ---- reads --------------------------------------------------------------

    /// The ONLY bool-returning read. The bool is unreachable outside coverage.
    function probe(bytes32 familyId, bytes32 scopeKey, bytes32 bucket, uint64 position) external view returns (bool) {
        StateStore.Store storage s = UpgradeStorage.efs();
        IndexLayerStorage.Layout storage l = IndexLayerStorage.layout();
        uint64 ordinal = l.familyOrdinal[familyId];
        if (ordinal == 0) revert Unsupported();
        uint256 fp = l.families[ordinal].packed;
        uint64 retiredAt = IndexLayerStorage.retiredAtOf(fp);
        if (retiredAt != 0) revert Frozen(retiredAt);
        bytes32 k10 = IndexKeys.posting(bytes32(0), 10, 0, scopeKey);
        uint64 count = uint64(s.postings[k10].head);
        if (position >= count) revert NotAPosition(position, count);
        if (l.bit(ordinal, scopeKey, bucket, position)) return true;
        uint256 cov = l.coverage[IndexLayerStorage.coverageKey(ordinal, scopeKey)];
        (uint64 through, uint64 liveFrom,,) = IndexLayerStorage.unpackCoverage(cov);
        if (position < through) return false;
        uint64 d = IndexLayerStorage.declaredAtOf(fp);
        if (ordinalAt(s, k10, position) > d) return false; // born after d: hook-maintained, no slot needed
        // Revert path only: without a slot, derive the gap's end so the error is honest (log N reads).
        if (cov == 0) liveFrom = lowerBound(s, k10, count, d);
        revert Uncovered(position, through, liveFrom);
    }

    /// No bool anywhere. NotAPosition still reverts: an out-of-range position is a malformed query, not a coverage state.
    function probeTolerated(bytes32 familyId, bytes32 scopeKey, bytes32 bucket, uint64 position)
        external
        view
        returns (Tri, Coverage memory c)
    {
        StateStore.Store storage s = UpgradeStorage.efs();
        IndexLayerStorage.Layout storage l = IndexLayerStorage.layout();
        uint64 ordinal = l.familyOrdinal[familyId];
        if (ordinal == 0) return (Tri.UNSUPPORTED, c);
        c = coverageView(s, l, ordinal, scopeKey);
        if (position >= c.scopeCount) revert NotAPosition(position, c.scopeCount);
        if (c.retiredAt != 0) return (Tri.FROZEN, c);
        if (l.bit(ordinal, scopeKey, bucket, position)) return (Tri.HIT, c);
        if (position < c.through || position >= c.liveFrom) return (Tri.MISS_COVERED, c);
        return (Tri.UNCOVERED, c);
    }

    function coverageOf(bytes32 familyId, bytes32 scopeKey) external view returns (Coverage memory c) {
        IndexLayerStorage.Layout storage l = IndexLayerStorage.layout();
        uint64 ordinal = l.familyOrdinal[familyId];
        if (ordinal == 0) revert Unsupported();
        return coverageView(UpgradeStorage.efs(), l, ordinal, scopeKey);
    }

    function family(bytes32 familyId) external view returns (IndexLayerStorage.Family memory) {
        IndexLayerStorage.Layout storage l = IndexLayerStorage.layout();
        uint64 ordinal = l.familyOrdinal[familyId];
        if (ordinal == 0) revert Unsupported();
        return l.families[ordinal];
    }

    /// Positions in `scopeKey` whose bit is set for `bucket`, in position order.
    /// COMPLETE iff the scan exhausted the scope AND coverage is complete AND the
    /// family is live; the gap [through, liveFrom) is explicit in Coverage.
    /// The cursor commits the admission high-water and the coverage revision;
    /// any admission (a rebind is one) between pages makes it invalid: the
    /// caller re-bases from cursor 0. Never spliced.
    function page(
        bytes32 familyId,
        bytes32 scopeKey,
        bytes32 bucket,
        uint256 cursor,
        uint16 maxItems,
        uint64 basisOrdinal
    ) external view returns (StateAuditPages.PageResult memory result, Coverage memory c) {
        StateStore.Store storage s = UpgradeStorage.efs();
        IndexLayerStorage.Layout storage l = IndexLayerStorage.layout();
        result.realmBasis = s.init.initialRevisionId;
        result.highWaterOrdinal = s.count.admissions;
        result.items = new bytes32[](0);
        uint64 ordinal = l.familyOrdinal[familyId];
        if (ordinal == 0) {
            result.completeness = StateAuditPages.Completeness.UNSUPPORTED;
            return (result, c);
        }
        if (basisOrdinal != 0 && basisOrdinal != result.highWaterOrdinal) {
            revert ErrPageBasis(basisOrdinal, result.highWaterOrdinal);
        }
        c = coverageView(s, l, ordinal, scopeKey);
        uint256 tag = uint256(keccak256(abi.encode(IndexLayerStorage.DOM_CURSOR, ordinal, scopeKey, bucket)))
            & ((uint256(1) << 96) - 1);
        uint64 next;
        if (cursor != 0) {
            next = uint64(cursor & U48);
            if (
                cursor >> 232 != 0 || uint8(cursor >> 128) != 1 || ((cursor >> 48) & U48) != c.highWater
                    || uint32(cursor >> 96) != c.revision || ((cursor >> 136) & ((uint256(1) << 96) - 1)) != tag
                    || next >= c.scopeCount
            ) revert ErrPageCursor(cursor);
        }
        uint256 limit = maxItems == 0 ? 1 : maxItems;
        if (limit > 512) limit = 512;
        result.items = new bytes32[](limit);
        bytes32 wk = IndexLayerStorage.wordKey(ordinal, scopeKey, bucket);
        uint256 n;
        uint256 scanned;
        while (next < c.scopeCount && n < limit && scanned < SCAN_MAX) {
            uint256 word = l.words[wk][next / 256]; // one read per 256 positions
            uint64 wordEnd = (next / 256 + 1) * 256;
            if (wordEnd > c.scopeCount) wordEnd = c.scopeCount;
            if (word == 0) {
                scanned += wordEnd - next;
                next = wordEnd;
                continue;
            }
            while (next < wordEnd && n < limit) {
                if (word & (uint256(1) << (next % 256)) != 0) result.items[n++] = bytes32(uint256(next));
                ++next;
                ++scanned;
            }
        }
        bytes32[] memory items = result.items;
        assembly ("memory-safe") {
            mstore(items, n)
        }
        // forge-lint: disable-next-line(unsafe-typecast)
        result.coverage = uint32(scanned);
        bool exhausted = next == c.scopeCount;
        bool covered = c.state == IndexLayerStorage.COV_COMPLETE;
        result.completeness = exhausted && covered && c.retiredAt == 0
            ? StateAuditPages.Completeness.COMPLETE
            : StateAuditPages.Completeness.PARTIAL;
        result.cursor = exhausted
            ? CURSOR_END
            : uint256(next) | (uint256(c.highWater) << 48) | (uint256(c.revision) << 96) | (uint256(1) << 128)
                | (tag << 136);
    }

    // ---- turn off: two-step, bits never cleared ----------------------------

    function announceDetach(bytes32 familyId) external returns (uint64 detachAt) {
        StateStore.Store storage s = UpgradeStorage.efs();
        IndexLayerStorage.Layout storage l = IndexLayerStorage.layout();
        uint64 ordinal = l.familyOrdinal[familyId];
        if (ordinal == 0) revert Unsupported();
        IndexLayerStorage.Family storage f = l.families[ordinal];
        uint256 fp = f.packed;
        if (IndexLayerStorage.detachAtOf(fp) != 0 || IndexLayerStorage.retiredAtOf(fp) != 0) revert DetachState(1);
        uint64 delay = l.detachDelay == 0 ? IndexLayerStorage.DEFAULT_DETACH_DELAY : l.detachDelay;
        detachAt = s.count.admissions + delay;
        f.packed = IndexLayerStorage.packFamily(
            IndexLayerStorage.fieldIndexOf(fp), 1, IndexLayerStorage.declaredAtOf(fp), detachAt, 0
        );
        emit DetachAnnounced(familyId, detachAt);
    }

    function detach(bytes32 familyId) external returns (uint64 retiredAt) {
        StateStore.Store storage s = UpgradeStorage.efs();
        IndexLayerStorage.Layout storage l = IndexLayerStorage.layout();
        uint64 ordinal = l.familyOrdinal[familyId];
        if (ordinal == 0) revert Unsupported();
        IndexLayerStorage.Family storage f = l.families[ordinal];
        uint256 fp = f.packed;
        uint64 detachAt = IndexLayerStorage.detachAtOf(fp);
        if (detachAt == 0 || IndexLayerStorage.retiredAtOf(fp) != 0) revert DetachState(2);
        if (s.count.admissions < detachAt) revert DetachState(3);
        retiredAt = s.count.admissions;
        f.packed = IndexLayerStorage.packFamily(
            IndexLayerStorage.fieldIndexOf(fp), 2, IndexLayerStorage.declaredAtOf(fp), detachAt, retiredAt
        );
        emit Detached(familyId, retiredAt);
    }

    // ---- helpers -------------------------------------------------------------

    function coverageView(
        StateStore.Store storage s,
        IndexLayerStorage.Layout storage l,
        uint64 ordinal,
        bytes32 scopeKey
    ) private view returns (Coverage memory c) {
        uint256 fp = l.families[ordinal].packed;
        c.declaredAt = IndexLayerStorage.declaredAtOf(fp);
        c.retiredAt = IndexLayerStorage.retiredAtOf(fp);
        c.highWater = s.count.admissions;
        bytes32 k10 = IndexKeys.posting(bytes32(0), 10, 0, scopeKey);
        c.scopeCount = uint64(s.postings[k10].head);
        uint256 cov = l.coverage[IndexLayerStorage.coverageKey(ordinal, scopeKey)];
        if (cov != 0) {
            c.slot = true;
            (c.through, c.liveFrom, c.revision, c.state) = IndexLayerStorage.unpackCoverage(cov);
        } else {
            // Display-side derivation only (log N reads): where the hook-maintained tail begins.
            c.liveFrom = lowerBound(s, k10, c.scopeCount, c.declaredAt);
            c.state = c.liveFrom == 0 ? IndexLayerStorage.COV_COMPLETE : IndexLayerStorage.COV_NONE;
        }
        if (c.retiredAt != 0) c.state = IndexLayerStorage.COV_FROZEN;
    }

    /// First position whose first-binding ordinal is > d (the kind-10 list is ordinal-sorted).
    function lowerBound(StateStore.Store storage s, bytes32 k10, uint64 count, uint64 d) private view returns (uint64) {
        uint64 lo;
        uint64 hi = count;
        while (lo < hi) {
            uint64 mid = lo + (hi - lo) / 2;
            if (ordinalAt(s, k10, mid) <= d) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }

    function ordinalAt(StateStore.Store storage s, bytes32 k10, uint64 position) private view returns (uint64) {
        return uint64((s.postingWords[k10][position / 5] >> (48 * (position % 5))) & U48);
    }

    function scopeKeyOf(bytes32 principal, bytes32 purpose, bytes32 subject) external pure returns (bytes32) {
        return IndexKeys.scope(principal, purpose, subject);
    }

    function bucketOf(bytes memory fieldBytes) external pure returns (bytes32) {
        return IndexKeys.scalar(fieldBytes);
    }
}
