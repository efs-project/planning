// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import {PostingAccess} from "./PostingAccess.sol";
import {StateStore} from "./StateStore.sol";
import {Preparation} from "./Preparation.sol";
import {BindingFold} from "./BindingFold.sol";
import {IndexKeys} from "./IndexKeys.sol";
import {ImmutableByteView} from "./ImmutableByteView.sol";

library StateKernel {
    struct EnvelopeHeader {
        uint16 profile;
        bytes32 principalId;
        bytes32 authorityRef;
        uint64 authEpoch;
        bytes32 pubNonce;
        uint64 notAfter;
    }

    struct SelectedLeaf {
        uint16 leafIndex;
        bytes32 typeId;
        bytes body;
    }

    struct ExpectedRevision {
        uint16 leafIndex;
        uint32 revision;
    }

    struct VerifiedContext {
        bytes32 authenticatedPrincipal;
        uint32 revisionOrdinal;
        uint256 authorityBasis;
        bytes32 authorityCodehash;
    }

    struct Publication {
        bytes32 envelopeId;
        EnvelopeHeader header;
        bytes32[] recordIds;
        uint64 leafMask;
        SelectedLeaf[] leaves;
        ExpectedRevision[] expectedRevisions;
    }

    struct LeafResult {
        uint16 leafIndex;
        uint8 outcome;
        uint64 admissionOrdinal;
    }

    struct AdmitResult {
        bytes32 envelopeId;
        uint64 envelopeOrdinal;
        uint64 acceptingBatchId;
        LeafResult[] leaves;
    }

    struct Init {
        bytes32 realmId;
        bytes32 initialRevisionId;
        bytes intrinsicGroupBytes;
        bytes objectGroup1Bytes;
        bytes kernelGroup2Bytes;
    }
    error ReferenceUnproved(uint16 leaf, uint8 role);
    error ReferenceClassUnsupported(uint16 leaf, uint8 role, uint8 targetClass);
    error AUTH_PRINCIPAL_MISMATCH(bytes32 declared, bytes32 computed);
    error E_REF_UNSATISFIED(uint16 leafIndex, uint8 roleOrdinal);
    error E_SELF_ENVELOPE_OCCREF(uint16 sourceLeafIndex, uint16 targetLeafIndex);
    error E_UNKNOWN_TYPE(uint16 leafIndex);
    error E_NO_RESURRECTION(bytes32 envelopeId, uint16 leafIndex);
    error E_BOUNDS(uint16 code);
    error E_TARGET_EVIDENCE(uint16 withdrawalLeafIndex);
    error ErrWithdrawNotAuthor(
        bytes32 targetEnvelopeId, uint16 targetLeafIndex, bytes32 envelopePrincipal, bytes32 targetPrincipal
    );
    error U48_GUARD();
    error InvalidInitialization();
    error InvalidCommitment();
    error InvalidRevision(uint32 revisionOrdinal);
    error InvalidCasCarriage();
    error MissingTypeDependency(bytes32 typeId);
    error CacheConflict(bytes32 typeId);
    uint64 private constant GUARD = (uint64(1) << 48) - 1;
    /// keccak256(abi.encode(keccak256("EIP712Domain(string name,string version)"), keccak256("EFS2-Envelope"), keccak256("1")))
    bytes32 private constant ENVELOPE_DOMAIN = 0xad872d31d7c6ce265e4ef38af3d323a95450b98bdfe0a43ecacfd134e60e3848;
    /// keccak256("PublicationEnvelope(uint16 profile,bytes32 principalId,bytes32 authorityRef,uint64 authEpoch,bytes32 pubNonce,uint64 notAfter,bytes32[] recordIds)")
    bytes32 private constant ENVELOPE_TYPEHASH = 0x41cb229615379fa5d2f5213653ed99aedca39e150a8add884383d1c269d1b921;

    struct AdmissionContext {
        Preparation.Config config;
        StateStore.Counts count;
        StateStore.Bootstrap init;
        uint256[] recordRefs;
    }

    function initialize(StateStore.Store storage s, Init memory init, Preparation.Config memory config) internal {
        if (
            s.init.realmId != 0 || init.realmId == 0 || init.initialRevisionId == 0
                || init.objectGroup1Bytes.length == 0 || init.kernelGroup2Bytes.length == 0
        ) revert InvalidInitialization();
        Preparation.CompiledType memory meta = Preparation.intrinsic(config, init.intrinsicGroupBytes);
        bytes32 gh = keccak256(abi.encode(keccak256("efs2/typeschema-group/1"), keccak256(init.intrinsicGroupBytes)));
        if (meta.typeId != keccak256(abi.encode(keccak256("efs2/typeschema/1"), gh, uint256(0)))) {
            revert InvalidCommitment();
        }
        s.init = StateStore.Bootstrap(
            init.realmId,
            init.initialRevisionId,
            init.intrinsicGroupBytes,
            keccak256(init.objectGroup1Bytes),
            keccak256(init.kernelGroup2Bytes),
            meta.typeId,
            0,
            0,
            0,
            0
        );
        StateStore.writeType(
            s,
            meta.typeId,
            StateStore.TypeRow(0, 0, 1, 0, meta.cacheBytes),
            Preparation.deployCache(config, meta.cacheBytes)
        );
        s.typeIds[1] = meta.typeId;
        s.count.types = 1;
    }

    function admit(
        StateStore.Store storage s,
        VerifiedContext memory v,
        Publication memory p,
        Preparation.Config memory config
    ) internal returns (AdmitResult memory r) {
        return admitAtRevision(s, v, p, config, 1);
    }

    /// @notice Explicit host-checked revision seam; legacy admission stays revision one.
    function admitAtRevision(
        StateStore.Store storage s,
        VerifiedContext memory v,
        Publication memory p,
        Preparation.Config memory config,
        uint32 activeRevision
    ) internal returns (AdmitResult memory r) {
        if (s.init.realmId == 0) revert InvalidInitialization();
        if (p.header.principalId != v.authenticatedPrincipal) {
            revert AUTH_PRINCIPAL_MISMATCH(p.header.principalId, v.authenticatedPrincipal);
        }
        if (activeRevision == 0 || v.revisionOrdinal != activeRevision) revert InvalidRevision(v.revisionOrdinal);
        carriage(p);
        r.envelopeId = p.envelopeId;
        r.envelopeOrdinal = StateStore.envelopeOrdinal(s, p.envelopeId);
        r.leaves = new LeafResult[](p.leaves.length);
        uint256 fresh;
        for (uint256 i; i < p.leaves.length; ++i) {
            SelectedLeaf memory leaf = p.leaves[i];
            uint256 packedStatus = s.occurrences[occKey(p.envelopeId, leaf.leafIndex)].packed;
            // Lifecycle packing fixes status in the low byte and the admission
            // ordinal in the next 48 bits; the remaining bits are reserved.
            // forge-lint: disable-next-line(unsafe-typecast)
            uint8 status = uint8(packedStatus);
            if (status > 1) revert E_NO_RESURRECTION(p.envelopeId, leaf.leafIndex);
            // GUARD masks the shifted value to the declared u48 ordinal range.
            // forge-lint: disable-next-line(unsafe-typecast)
            uint64 ord = uint64((packedStatus >> 8) & GUARD);
            r.leaves[i] = LeafResult(leaf.leafIndex, status == 1 ? 2 : 1, ord);
            if (status == 0) ++fresh;
        }
        AdmissionContext memory plan;
        plan.config = config;
        plan.count = s.count;
        plan.init = s.init;
        if (fresh == 0) {
            for (uint256 i; i < p.leaves.length; ++i) {
                checked(
                    s, plan, p.leaves[i], p.envelopeId, p.recordIds[p.leaves[i].leafIndex], p.header.principalId, true
                );
            }
            return r;
        }
        if (fresh >= GUARD - plan.count.admissions || block.number >= GUARD) revert U48_GUARD();
        // Rows are applied in order while persisted counts/bootstrap stay at
        // their entry values. Only the pinned argument-driven helper is in scope;
        // arbitrary callbacks can observe this provisional prefix.
        bytes32 countBefore = keccak256(abi.encode(s.count));
        bytes32 initBefore = keccak256(abi.encode(s.init));
        uint256 envelopeRef;
        (plan.recordRefs, envelopeRef) = planBytes(s, p, r, config);
        r.acceptingBatchId = next(plan.count.batches);
        plan.count.batches = r.acceptingBatchId;
        if (r.envelopeOrdinal == 0) {
            r.envelopeOrdinal = next(plan.count.envelopes);
            plan.count.envelopes = r.envelopeOrdinal;
            // next() enforces the physical u48 ordinal domain before narrowing.
            s.envelopes[p.envelopeId] = StateStore.EnvelopeCell(
                address(uint160(envelopeRef)),
                0,
                uint16(envelopeRef >> 176),
                uint16(envelopeRef >> 192),
                uint48(r.envelopeOrdinal)
            );
            put(s, plan, StateStore.Kind.EnvelopeId, 0, r.envelopeOrdinal, abi.encode(p.envelopeId));
        }
        StateStore.PrincipalRow memory pr =
            abi.decode(get(s, plan, StateStore.Kind.Principal, p.header.principalId, 0), (StateStore.PrincipalRow));
        if (pr.principalOrdinal == 0) {
            pr = StateStore.PrincipalRow(next(plan.count.principals), plan.count.admissions + 1);
            plan.count.principals = pr.principalOrdinal;
            put(s, plan, StateStore.Kind.Principal, p.header.principalId, 0, abi.encode(pr));
            put(s, plan, StateStore.Kind.PrincipalId, 0, pr.principalOrdinal, abi.encode(p.header.principalId));
        }
        uint64 first = plan.count.admissions + 1;
        uint256 casIndex;
        for (uint256 i; i < p.leaves.length; ++i) {
            casIndex = planLeaf(s, plan, p, r.leaves[i], i, pr.principalOrdinal, casIndex);
        }
        if (casIndex != p.expectedRevisions.length) revert InvalidCasCarriage();
        put(
            s,
            plan,
            StateStore.Kind.Batch,
            0,
            r.acceptingBatchId,
            abi.encode(
                StateStore.BatchRow(
                    uint256(first) | (fresh << 48) | (block.number << 64) | (uint256(v.revisionOrdinal) << 112),
                    v.authorityBasis,
                    v.authorityCodehash
                )
            )
        );
        // A callback must not silently change staged count/init prestate.
        // Any failure reverts the entire prefix, including helper CREATEs.
        assert(countBefore == keccak256(abi.encode(s.count)) && initBefore == keccak256(abi.encode(s.init)));
        s.count = plan.count;
        s.init = plan.init;
    }

    /// First-seen bounded scan: at most 2016 RecordId comparisons for 64 leaves.
    /// Only bytes are planned here; Type/Record existence is installed later in original order.
    function planBytes(
        StateStore.Store storage s,
        Publication memory p,
        AdmitResult memory r,
        Preparation.Config memory config
    ) private returns (uint256[] memory refs, uint256 envelopeRef) {
        uint256 count = p.leaves.length;
        refs = new uint256[](count);
        bool[] memory copyBody = new bool[](count);
        bytes memory envelope = r.envelopeOrdinal == 0 ? abi.encode(p.header, p.recordIds) : new bytes(0);
        uint256 extent = envelope.length;
        bool allocate = extent != 0;
        for (uint256 i; i < count; ++i) {
            if (r.leaves[i].outcome == 2) continue;
            bytes32 id = p.recordIds[p.leaves[i].leafIndex];
            bool seen;
            for (uint256 j; j < i; ++j) {
                if (r.leaves[j].outcome != 2 && p.recordIds[p.leaves[j].leafIndex] == id) {
                    refs[i] = refs[j];
                    seen = true;
                    break;
                }
            }
            if (seen || StateStore.recordAdmissionMeta(s, id).recordOrdinal != 0) continue;
            // Low-bit marker distinguishes an absent empty Record from no allocation.
            refs[i] = 1 | (extent << 160) | (p.leaves[i].body.length << 176);
            copyBody[i] = true;
            allocate = true;
            extent += p.leaves[i].body.length;
        }
        if (!allocate) return (refs, 0);
        assert(extent <= 10496);
        // This is before leaf preparation, including records-only partial admission.
        if (config.helper.code.length == 0 || config.helper.codehash != config.codehash) {
            revert Preparation.HelperIdentity();
        }
        bytes memory payload = new bytes(extent);
        assembly ("memory-safe") { mcopy(add(payload, 32), add(envelope, 32), mload(envelope)) }
        for (uint256 i; i < count; ++i) {
            if (!copyBody[i]) continue;
            bytes memory body = p.leaves[i].body;
            uint256 offset = uint16(refs[i] >> 160);
            assembly ("memory-safe") { mcopy(add(add(payload, 32), offset), add(body, 32), mload(body)) }
        }
        address pointer = Preparation.deployCache(config, payload);
        uint256 common = uint256(uint160(pointer)) | (extent << 192);
        // Validate the returned whole block even when no Envelope slice is new.
        ImmutableByteView.length(common | (extent << 176), p.envelopeId);
        if (envelope.length != 0) envelopeRef = common | (envelope.length << 176);
        for (uint256 i; i < count; ++i) {
            if (refs[i] != 0) refs[i] = (refs[i] & ~uint256(1)) | common;
        }
    }

    function planLeaf(
        StateStore.Store storage s,
        AdmissionContext memory plan,
        Publication memory p,
        LeafResult memory result,
        uint256 i,
        uint64 principalOrdinal,
        uint256 casIndex
    ) private returns (uint256) {
        SelectedLeaf memory leaf = p.leaves[i];
        (Preparation.PreparedRecord memory prepared, uint64 typeOrdinal) =
            checked(s, plan, leaf, p.envelopeId, p.recordIds[leaf.leafIndex], p.header.principalId, false);
        BindingFold.Effect memory effect = prepared.effect;
        uint32 expected;
        if (effect.kind == 1 || effect.kind == 2) {
            if (casIndex >= p.expectedRevisions.length || p.expectedRevisions[casIndex].leafIndex != leaf.leafIndex) {
                revert InvalidCasCarriage();
            }
            expected = p.expectedRevisions[casIndex++].revision;
        }
        if (result.outcome == 2) return casIndex;
        references(s, plan, prepared.references, leaf.leafIndex);
        uint64 ord = next(plan.count.admissions);
        plan.count.admissions = ord;
        result.admissionOrdinal = ord;
        bytes32 recordId = p.recordIds[leaf.leafIndex];
        {
            StateStore.RecordAdmissionMeta memory observed = StateStore.recordAdmissionMeta(s, recordId);
            if (observed.recordOrdinal == 0) {
                StateStore.RecordCell memory rr =
                    StateStore.RecordCell(leaf.typeId, plan.recordRefs[i], next(plan.count.records), ord);
                plan.count.records = rr.recordOrdinal;
                put(s, plan, StateStore.Kind.Record, recordId, 0, abi.encode(rr));
                put(s, plan, StateStore.Kind.RecordId, 0, rr.recordOrdinal, abi.encode(recordId));
            }
        }
        // The leaf's own type row cannot change below: group() only creates
        // member rows, and a member colliding with an existing row reverts.
        if (leaf.typeId == plan.init.metaTypeId) group(s, plan, leaf.body, recordId, ord);
        put(
            s,
            plan,
            StateStore.Kind.Admission,
            0,
            ord,
            abi.encode(
                StateStore.AdmissionRow(
                    p.envelopeId,
                    uint256(leaf.leafIndex) | (uint256(typeOrdinal) << 16) | (uint256(principalOrdinal) << 64)
                )
            )
        );
        put(
            s,
            plan,
            StateStore.Kind.Lifecycle,
            occKey(p.envelopeId, leaf.leafIndex),
            0,
            abi.encode(StateStore.LifecycleRow(1 | (uint256(ord) << 8)))
        );
        occurrencePostings(s, plan, leaf.typeId, prepared.occurrenceKeys, ord, true);
        if (effect.kind == 1 || effect.kind == 2) bindingEffect(s, plan, effect, p.header.principalId, expected, ord);
        else if (effect.kind == 3) withdrawal(s, plan, effect, p.header.principalId, leaf.leafIndex, ord);
        return casIndex;
    }

    function carriage(Publication memory p) private pure {
        uint256 n = p.recordIds.length;
        if (
            n == 0 || n > 64 || p.leaves.length == 0 || p.leaves.length > 64 || p.expectedRevisions.length > 64
                || (n < 64 && p.leafMask >> n != 0)
        ) revert E_BOUNDS(1);
        uint64 mask;
        uint256 total;
        for (uint256 i; i < p.leaves.length; ++i) {
            SelectedLeaf memory leaf = p.leaves[i];
            if (leaf.leafIndex >= n || (i != 0 && leaf.leafIndex <= p.leaves[i - 1].leafIndex)) revert E_BOUNDS(2);
            mask |= uint64(1) << leaf.leafIndex;
            total += leaf.body.length;
            if (leaf.body.length > 8192 || total > 8192) revert E_BOUNDS(3);
            if (
                p.recordIds[leaf.leafIndex]
                    != keccak256(abi.encode(keccak256("efs2/record/1"), leaf.typeId, keccak256(leaf.body)))
            ) revert InvalidCommitment();
        }
        if (mask != p.leafMask) revert E_BOUNDS(2);
        bytes32 statement = keccak256(abi.encode(ENVELOPE_TYPEHASH, p.header, keccak256(abi.encodePacked(p.recordIds))));
        if (
            p.envelopeId
                != keccak256(
                    abi.encode(
                        keccak256("efs2/envelope/1"), keccak256(abi.encodePacked(hex"1901", ENVELOPE_DOMAIN, statement))
                    )
                )
        ) revert InvalidCommitment();
    }

    function checked(
        StateStore.Store storage s,
        AdmissionContext memory p,
        SelectedLeaf memory leaf,
        bytes32 envelopeId,
        bytes32 recordId,
        bytes32 principal,
        bool bodyOnly
    ) private view returns (Preparation.PreparedRecord memory prepared, uint64 typeOrdinal) {
        StateStore.TypeRow memory tr = abi.decode(get(s, p, StateStore.Kind.Type, leaf.typeId, 0), (StateStore.TypeRow));
        if (tr.typeOrdinal == 0) revert E_UNKNOWN_TYPE(leaf.leafIndex);
        typeOrdinal = tr.typeOrdinal;
        prepared =
            Preparation.record(p.config, tr.cacheBytes, leaf.typeId, leaf.body, recordId, principal, ids(p), bodyOnly);
        for (uint256 j; j < prepared.references.length; ++j) {
            if (prepared.references[j].targetClass == 4 && prepared.references[j].targetId == envelopeId) {
                revert E_SELF_ENVELOPE_OCCREF(leaf.leafIndex, prepared.references[j].leafIndex);
            }
        }
    }

    function references(
        StateStore.Store storage s,
        AdmissionContext memory p,
        Preparation.PreparedRef[] memory refs,
        uint16 leaf
    ) private view {
        for (uint256 i; i < refs.length; ++i) {
            Preparation.PreparedRef memory ref = refs[i];
            if (ref.targetClass == 1 || ref.targetClass == 5) {
                StateStore.RecordAdmissionMeta memory target = StateStore.recordAdmissionMeta(s, ref.targetId);
                if (target.recordOrdinal == 0) revert ReferenceUnproved(leaf, ref.roleIndex);
                if (
                    (ref.targetClass == 5
                            && (p.init.objectGenesisType == 0 || target.typeId != p.init.objectGenesisType))
                        || (ref.expectedType != 0 && ref.expectedType != target.typeId)
                ) revert E_REF_UNSATISFIED(leaf, ref.roleIndex);
            } else if (ref.targetClass == 4) {
                bytes memory raw = StateStore.envelopeRow(s, ref.targetId).canonicalUnsignedEnvelope;
                if (raw.length == 0) revert ReferenceUnproved(leaf, ref.roleIndex);
                (, bytes32[] memory vector) = abi.decode(raw, (EnvelopeHeader, bytes32[]));
                if (ref.leafIndex >= vector.length) revert E_REF_UNSATISFIED(leaf, ref.roleIndex);
            } else {
                revert ReferenceClassUnsupported(leaf, ref.roleIndex, ref.targetClass);
            }
        }
    }

    function group(
        StateStore.Store storage s,
        AdmissionContext memory p,
        bytes memory body,
        bytes32 recordId,
        uint64 ord
    ) private {
        bytes memory raw = new bytes(body.length - 2);
        for (uint256 i; i < raw.length; ++i) {
            raw[i] = body[i + 2];
        }
        Preparation.CompiledGroup memory compiled = Preparation.group(p.config, raw);
        bytes32 hash = keccak256(raw);
        bytes32 gh = keccak256(abi.encode(keccak256("efs2/typeschema-group/1"), hash));
        if (compiled.groupHash != gh || compiled.rawHash != hash) revert InvalidCommitment();
        Preparation.CompiledType[] memory ss = compiled.types;
        bytes32[] memory deps = compiled.dependencies;
        for (uint256 i; i < deps.length; ++i) {
            if (StateStore.typeDependencyOrdinal(s, deps[i]) == 0) {
                revert MissingTypeDependency(deps[i]);
            }
        }
        for (uint256 i; i < ss.length; ++i) {
            if (ss[i].typeId != keccak256(abi.encode(keccak256("efs2/typeschema/1"), gh, i))) {
                revert InvalidCommitment();
            }
            StateStore.TypeRow memory row =
                abi.decode(get(s, p, StateStore.Kind.Type, ss[i].typeId, 0), (StateStore.TypeRow));
            bytes memory cache = ss[i].cacheBytes;
            if (row.typeOrdinal != 0) {
                if (
                    row.groupRecordId != recordId || row.memberIndex != i
                        || keccak256(row.cacheBytes) != keccak256(cache)
                ) {
                    revert CacheConflict(ss[i].typeId);
                }
            } else {
                row = StateStore.TypeRow(recordId, uint16(i), next(p.count.types), ord, cache);
                p.count.types = row.typeOrdinal;
                put(s, p, StateStore.Kind.Type, ss[i].typeId, 0, abi.encode(row));
                put(s, p, StateStore.Kind.TypeId, 0, row.typeOrdinal, abi.encode(ss[i].typeId));
            }
        }
        if (hash == p.init.objectGroup1Hash) {
            if (ss.length != 6) revert InvalidInitialization();
            p.init.objectGenesisType = ss[0].typeId;
        }
        if (hash == p.init.kernelGroup2Hash) {
            if (ss.length != 3) revert InvalidInitialization();
            p.init.bindingSetType = ss[0].typeId;
            p.init.bindingTombstoneType = ss[1].typeId;
            p.init.withdrawalType = ss[2].typeId;
        }
    }

    function occurrencePostings(
        StateStore.Store storage s,
        AdmissionContext memory p,
        bytes32 typeId,
        bytes32[] memory keys,
        uint64 ord,
        bool add
    ) private {
        uint256 beforeHead;
        for (uint256 i; i < keys.length; ++i) {
            uint256 old;
            if (add) old = append(s, p, keys[i], ord, false);
            else old = liveDelta(s, p, keys[i], false);
            if (i == 0) beforeHead = old;
        }
        uint64 live = uint64(beforeHead >> 64);
        bytes32 unique = IndexKeys.posting(typeId, 2, 0, 0);
        if (add && live == 0) {
            if (uint64(beforeHead) == 0) {
                append(s, p, unique, ord, false);
            } else {
                liveDelta(s, p, unique, true);
            }
        }
        if (!add && live == 1) liveDelta(s, p, unique, false);
    }

    function bindingEffect(
        StateStore.Store storage s,
        AdmissionContext memory p,
        BindingFold.Effect memory effect,
        bytes32 principal,
        uint32 expected,
        uint64 ord
    ) private {
        bytes32 key = BindingFold.bindingKey(principal, BindingFold.positionKey(effect));
        StateStore.BindingRow memory row =
            abi.decode(get(s, p, StateStore.Kind.Binding, key, 0), (StateStore.BindingRow));
        BindingFold.Head memory beforeHead = BindingFold.unpack(row.meta, row.target);
        BindingFold.OccurrenceRef memory source;
        if (beforeHead.admissionOrdinal != 0) {
            StateStore.AdmissionRow memory old = abi.decode(
                get(s, p, StateStore.Kind.Admission, 0, beforeHead.admissionOrdinal), (StateStore.AdmissionRow)
            );
            source = BindingFold.OccurrenceRef(old.envelopeId, uint16(old.packed));
        }
        BindingFold.Head memory afterHead = BindingFold.advance(key, beforeHead, source, effect, expected, ord);
        if (beforeHead.state == 0) {
            p.count.bindingKeys = next(p.count.bindingKeys);
            put(s, p, StateStore.Kind.BindingKey, 0, p.count.bindingKeys, abi.encode(key));
            append(
                s, p, IndexKeys.posting(0, 10, 0, IndexKeys.scope(principal, effect.purpose, effect.subject)), ord, true
            );
        }
        saveBinding(s, p, key, afterHead, ord);
    }

    function saveBinding(
        StateStore.Store storage s,
        AdmissionContext memory p,
        bytes32 key,
        BindingFold.Head memory h,
        uint64 ord
    ) private {
        (uint256 meta, bytes32 target) = BindingFold.pack(h);
        put(s, p, StateStore.Kind.Binding, key, 0, abi.encode(StateStore.BindingRow(meta, target)));
        append(s, p, IndexKeys.posting(0, 8, 0, key), ord, true);
    }

    function withdrawal(
        StateStore.Store storage s,
        AdmissionContext memory p,
        BindingFold.Effect memory e,
        bytes32 author,
        uint16 sourceLeaf,
        uint64 ord
    ) private {
        bytes32 key = occKey(e.targetA, e.targetLeaf);
        uint256 life = abi.decode(get(s, p, StateStore.Kind.Lifecycle, key, 0), (StateStore.LifecycleRow)).packed;
        if (uint8(life) == 0 || uint8(life) == 3) revert E_TARGET_EVIDENCE(sourceLeaf);
        (EnvelopeHeader memory eh, bytes32[] memory vector) =
            abi.decode(StateStore.envelopeRow(s, e.targetA).canonicalUnsignedEnvelope, (EnvelopeHeader, bytes32[]));
        if (eh.principalId != author) revert ErrWithdrawNotAuthor(e.targetA, e.targetLeaf, author, eh.principalId);
        StateStore.RecordRow memory rr = StateStore.recordRow(s, vector[e.targetLeaf]);
        if (rr.typeId == p.init.withdrawalType) revert E_TARGET_EVIDENCE(sourceLeaf);
        if (uint8(life) == 2) return;
        uint64 targetOrd = uint64((life >> 8) & GUARD);
        Preparation.PreparedRecord memory prepared = Preparation.record(
            p.config,
            StateStore.cacheBytes(s.types[rr.typeId].cacheCode),
            rr.typeId,
            rr.body,
            vector[e.targetLeaf],
            eh.principalId,
            ids(p),
            false
        );
        put(
            s,
            p,
            StateStore.Kind.Lifecycle,
            key,
            0,
            abi.encode(StateStore.LifecycleRow(2 | (uint256(targetOrd) << 8) | (uint256(ord) << 56)))
        );
        occurrencePostings(s, p, rr.typeId, prepared.occurrenceKeys, ord, false);
        BindingFold.Effect memory old = prepared.effect;
        if (old.kind == 1 || old.kind == 2) {
            bytes32 bindingKey = BindingFold.bindingKey(author, BindingFold.positionKey(old));
            StateStore.BindingRow memory br =
                abi.decode(get(s, p, StateStore.Kind.Binding, bindingKey, 0), (StateStore.BindingRow));
            BindingFold.Head memory bh = BindingFold.unpack(br.meta, br.target);
            if (bh.admissionOrdinal == targetOrd) {
                saveBinding(s, p, bindingKey, BindingFold.withdrawHead(bindingKey, bh, ord), ord);
            }
        }
    }

    function append(StateStore.Store storage s, AdmissionContext memory p, bytes32 key, uint64 ord, bool audit)
        private returns (uint256 beforeHead)
    {
        (beforeHead, p.count.postingKeys) = PostingAccess.append(s.postingStore, key, ord, audit, p.count.postingKeys);
    }

    function liveDelta(StateStore.Store storage s, AdmissionContext memory, bytes32 key, bool increase)
        private returns (uint256)
    {
        return PostingAccess.liveDelta(s.postingStore, key, increase);
    }

    function get(StateStore.Store storage s, AdmissionContext memory, StateStore.Kind kind, bytes32 key, uint64 index)
        internal
        view
        returns (bytes memory)
    {
        return StateStore.read(s, kind, key, index);
    }

    function put(
        StateStore.Store storage s,
        AdmissionContext memory p,
        StateStore.Kind kind,
        bytes32 key,
        uint64 index,
        bytes memory value
    ) internal {
        StateStore.applyRow(s, kind, key, index, value, p.config);
    }

    function next(uint64 n) private pure returns (uint64) {
        if (n >= GUARD - 1) revert U48_GUARD();
        return n + 1;
    }

    function occKey(bytes32 envelopeId, uint16 leaf) internal pure returns (bytes32) {
        return keccak256(abi.encode(keccak256("efs2/occurrence/1"), envelopeId, uint256(leaf)));
    }

    function ids(AdmissionContext memory p) private pure returns (BindingFold.KernelIds memory) {
        return BindingFold.KernelIds(p.init.bindingSetType, p.init.bindingTombstoneType, p.init.withdrawalType);
    }
}
