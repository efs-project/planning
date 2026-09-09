// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import {StateStore} from "./StateStore.sol";
import {Preparation} from "./Preparation.sol";
import {BindingFold} from "./BindingFold.sol";
import {IndexKeys} from "./IndexKeys.sol";

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

    struct Plan {
        Preparation.Config config;
        StateStore.Change[] changes;
        uint256 length;
        StateStore.Counts count;
        StateStore.Bootstrap init;
        uint256[] slots;
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
        s.types[meta.typeId] = StateStore.TypeRow(0, 0, 1, 0, meta.cacheBytes);
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
        r.envelopeOrdinal = s.envelopes[p.envelopeId].envelopeOrdinal;
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
        Plan memory plan;
        plan.config = config;
        plan.count = s.count;
        plan.init = s.init;
        // ACTIVE leaves stage nothing. Each fresh leaf has a conservative
        // 256-change allowance; Envelope/Principal pairs and Batch add five.
        allocateJournal(plan, fresh == 0 ? 0 : fresh * 256 + 5);
        if (fresh == 0) {
            for (uint256 i; i < p.leaves.length; ++i) {
                checked(
                    s, plan, p.leaves[i], p.envelopeId, p.recordIds[p.leaves[i].leafIndex], p.header.principalId, true
                );
            }
            return r;
        }
        if (fresh >= GUARD - plan.count.admissions || block.number >= GUARD) revert U48_GUARD();
        r.acceptingBatchId = next(plan.count.batches);
        plan.count.batches = r.acceptingBatchId;
        if (r.envelopeOrdinal == 0) {
            r.envelopeOrdinal = next(plan.count.envelopes);
            plan.count.envelopes = r.envelopeOrdinal;
            put(
                s,
                plan,
                StateStore.Kind.Envelope,
                p.envelopeId,
                0,
                abi.encode(StateStore.EnvelopeRow(abi.encode(p.header, p.recordIds), r.envelopeOrdinal))
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
        // No semantic decisions below this boundary. All journal prestates are
        // checked against storage immediately before the recorded write.
        bytes32 countBefore = keccak256(abi.encode(s.count));
        bytes32 initBefore = keccak256(abi.encode(s.init));
        for (uint256 i; i < plan.length; ++i) {
            StateStore.replay(s, plan.changes[i]);
        }
        assert(countBefore == keccak256(abi.encode(s.count)) && initBefore == keccak256(abi.encode(s.init)));
        s.count = plan.count;
        s.init = plan.init;
    }

    function planLeaf(
        StateStore.Store storage s,
        Plan memory plan,
        Publication memory p,
        LeafResult memory result,
        uint256 i,
        uint64 principalOrdinal,
        uint256 casIndex
    ) private view returns (uint256) {
        SelectedLeaf memory leaf = p.leaves[i];
        Preparation.PreparedRecord memory prepared =
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
            StateStore.RecordRow memory rr =
                abi.decode(get(s, plan, StateStore.Kind.Record, recordId, 0), (StateStore.RecordRow));
            if (rr.recordOrdinal == 0) {
                rr = StateStore.RecordRow(leaf.typeId, leaf.body, next(plan.count.records), ord);
                plan.count.records = rr.recordOrdinal;
                put(s, plan, StateStore.Kind.Record, recordId, 0, abi.encode(rr));
                put(s, plan, StateStore.Kind.RecordId, 0, rr.recordOrdinal, abi.encode(recordId));
            }
        }
        if (leaf.typeId == plan.init.metaTypeId) group(s, plan, leaf.body, recordId, ord);
        StateStore.TypeRow memory tr =
            abi.decode(get(s, plan, StateStore.Kind.Type, leaf.typeId, 0), (StateStore.TypeRow));
        put(
            s,
            plan,
            StateStore.Kind.Admission,
            0,
            ord,
            abi.encode(
                StateStore.AdmissionRow(
                    p.envelopeId,
                    uint256(leaf.leafIndex) | (uint256(tr.typeOrdinal) << 16) | (uint256(principalOrdinal) << 64)
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
        bytes32 domain = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version)"), keccak256("EFS2-Envelope"), keccak256("1")
            )
        );
        bytes32 statement = keccak256(
            abi.encode(
                keccak256(
                    "PublicationEnvelope(uint16 profile,bytes32 principalId,bytes32 authorityRef,uint64 authEpoch,bytes32 pubNonce,uint64 notAfter,bytes32[] recordIds)"
                ),
                p.header,
                keccak256(abi.encodePacked(p.recordIds))
            )
        );
        if (
            p.envelopeId
                != keccak256(
                    abi.encode(keccak256("efs2/envelope/1"), keccak256(abi.encodePacked(hex"1901", domain, statement)))
                )
        ) revert InvalidCommitment();
    }

    function checked(
        StateStore.Store storage s,
        Plan memory p,
        SelectedLeaf memory leaf,
        bytes32 envelopeId,
        bytes32 recordId,
        bytes32 principal,
        bool bodyOnly
    ) private view returns (Preparation.PreparedRecord memory prepared) {
        StateStore.TypeRow memory tr = abi.decode(get(s, p, StateStore.Kind.Type, leaf.typeId, 0), (StateStore.TypeRow));
        if (tr.typeOrdinal == 0) revert E_UNKNOWN_TYPE(leaf.leafIndex);
        prepared =
            Preparation.record(p.config, tr.cacheBytes, leaf.typeId, leaf.body, recordId, principal, ids(p), bodyOnly);
        for (uint256 j; j < prepared.references.length; ++j) {
            if (prepared.references[j].targetClass == 4 && prepared.references[j].targetId == envelopeId) {
                revert E_SELF_ENVELOPE_OCCREF(leaf.leafIndex, prepared.references[j].leafIndex);
            }
        }
    }

    function references(StateStore.Store storage s, Plan memory p, Preparation.PreparedRef[] memory refs, uint16 leaf)
        private
        view
    {
        for (uint256 i; i < refs.length; ++i) {
            Preparation.PreparedRef memory ref = refs[i];
            if (ref.targetClass == 1 || ref.targetClass == 5) {
                StateStore.RecordRow memory target =
                    abi.decode(get(s, p, StateStore.Kind.Record, ref.targetId, 0), (StateStore.RecordRow));
                if (target.recordOrdinal == 0) revert ReferenceUnproved(leaf, ref.roleIndex);
                if (
                    (ref.targetClass == 5
                            && (p.init.objectGenesisType == 0 || target.typeId != p.init.objectGenesisType))
                        || (ref.expectedType != 0 && ref.expectedType != target.typeId)
                ) revert E_REF_UNSATISFIED(leaf, ref.roleIndex);
            } else if (ref.targetClass == 4) {
                bytes memory raw = s.envelopes[ref.targetId].canonicalUnsignedEnvelope;
                if (raw.length == 0) revert ReferenceUnproved(leaf, ref.roleIndex);
                (, bytes32[] memory vector) = abi.decode(raw, (EnvelopeHeader, bytes32[]));
                if (ref.leafIndex >= vector.length) revert E_REF_UNSATISFIED(leaf, ref.roleIndex);
            } else {
                revert ReferenceClassUnsupported(leaf, ref.roleIndex, ref.targetClass);
            }
        }
    }

    function group(StateStore.Store storage s, Plan memory p, bytes memory body, bytes32 recordId, uint64 ord)
        private
        view
    {
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
            if (abi.decode(get(s, p, StateStore.Kind.Type, deps[i], 0), (StateStore.TypeRow)).typeOrdinal == 0) {
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
        Plan memory p,
        bytes32 typeId,
        bytes32[] memory keys,
        uint64 ord,
        bool add
    ) private view {
        uint256 beforeHead = head(s, p, keys[0]);
        uint64 live = uint64(beforeHead >> 64);
        for (uint256 i; i < keys.length; ++i) {
            if (add) append(s, p, keys[i], ord, false);
            else liveDelta(s, p, keys[i], false);
        }
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
        Plan memory p,
        BindingFold.Effect memory effect,
        bytes32 principal,
        uint32 expected,
        uint64 ord
    ) private view {
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

    function saveBinding(StateStore.Store storage s, Plan memory p, bytes32 key, BindingFold.Head memory h, uint64 ord)
        private
        view
    {
        (uint256 meta, bytes32 target) = BindingFold.pack(h);
        put(s, p, StateStore.Kind.Binding, key, 0, abi.encode(StateStore.BindingRow(meta, target)));
        append(s, p, IndexKeys.posting(0, 8, 0, key), ord, true);
    }

    function withdrawal(
        StateStore.Store storage s,
        Plan memory p,
        BindingFold.Effect memory e,
        bytes32 author,
        uint16 sourceLeaf,
        uint64 ord
    ) private view {
        bytes32 key = occKey(e.targetA, e.targetLeaf);
        uint256 life = abi.decode(get(s, p, StateStore.Kind.Lifecycle, key, 0), (StateStore.LifecycleRow)).packed;
        if (uint8(life) == 0 || uint8(life) == 3) revert E_TARGET_EVIDENCE(sourceLeaf);
        (EnvelopeHeader memory eh, bytes32[] memory vector) =
            abi.decode(s.envelopes[e.targetA].canonicalUnsignedEnvelope, (EnvelopeHeader, bytes32[]));
        if (eh.principalId != author) revert ErrWithdrawNotAuthor(e.targetA, e.targetLeaf, author, eh.principalId);
        StateStore.RecordRow memory rr = s.records[vector[e.targetLeaf]];
        if (rr.typeId == p.init.withdrawalType) revert E_TARGET_EVIDENCE(sourceLeaf);
        if (uint8(life) == 2) return;
        uint64 targetOrd = uint64((life >> 8) & GUARD);
        Preparation.PreparedRecord memory prepared = Preparation.record(
            p.config,
            s.types[rr.typeId].cacheBytes,
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

    function head(StateStore.Store storage s, Plan memory p, bytes32 key) private view returns (uint256) {
        return abi.decode(get(s, p, StateStore.Kind.Posting, key, 0), (StateStore.PostingRow)).head;
    }

    function append(StateStore.Store storage s, Plan memory p, bytes32 key, uint64 ord, bool audit) private view {
        uint256 beforeHead = head(s, p, key);
        uint64 count = uint64(beforeHead);
        uint64 live = uint64(beforeHead >> 64);
        uint64 last = uint64((beforeHead >> 128) & GUARD);
        uint16 flags = uint16(beforeHead >> 176);
        assert(ord > last && (count == 0 || flags == (audit ? 1 : 0)));
        if (count >= GUARD - 1 || live >= GUARD - 1) revert U48_GUARD();
        if (count == 0) {
            p.count.postingKeys = next(p.count.postingKeys);
            put(s, p, StateStore.Kind.PostingKey, 0, p.count.postingKeys, abi.encode(key));
        }
        uint64 wordIndex = count / 5;
        uint256 word = abi.decode(get(s, p, StateStore.Kind.Word, key, wordIndex), (uint256));
        uint256 shift = 48 * (count % 5);
        assert((word >> shift) == 0);
        put(s, p, StateStore.Kind.Word, key, wordIndex, abi.encode(word | (uint256(ord) << shift)));
        put(
            s,
            p,
            StateStore.Kind.Posting,
            key,
            0,
            abi.encode(
                StateStore.PostingRow(
                    uint256(count + 1) | (uint256(live + 1) << 64) | (uint256(ord) << 128)
                        | (uint256(audit ? 1 : 0) << 176)
                )
            )
        );
    }

    function liveDelta(StateStore.Store storage s, Plan memory p, bytes32 key, bool increase) private view {
        uint256 h = head(s, p, key);
        uint64 live = uint64(h >> 64);
        assert(uint16(h >> 176) == 0);
        if (increase) {
            if (live >= GUARD - 1) revert U48_GUARD();
            ++live;
        } else {
            assert(live > 0);
            --live;
        }
        put(
            s,
            p,
            StateStore.Kind.Posting,
            key,
            0,
            abi.encode(StateStore.PostingRow((h & ~(uint256(type(uint64).max) << 64)) | (uint256(live) << 64)))
        );
    }

    // Memory-only index; persisted rows and journal replay ordering are unchanged.
    // Admission bounds capacity to 64 * 256 + 5, so the table is at most 65536.
    function allocateJournal(Plan memory p, uint256 capacity) internal pure {
        p.changes = new StateStore.Change[](capacity);
        if (capacity == 0) return;
        uint256 size = 1;
        while (size < capacity * 2) size <<= 1;
        p.slots = new uint256[](size);
    }

    function journalSlot(Plan memory p, StateStore.Kind kind, bytes32 key, uint64 index)
        private
        pure
        returns (uint256 slot)
    {
        uint256 size = p.slots.length;
        // Three canonical ABI words in temporary free memory. Do not advance
        // the allocator or overwrite Solidity's zero slot; no value escapes.
        bytes32 hash;
        assembly ("memory-safe") {
            let ptr := mload(0x40)
            mstore(ptr, and(kind, 0xff))
            mstore(add(ptr, 0x20), key)
            mstore(add(ptr, 0x40), and(index, 0xffffffffffffffff))
            hash := keccak256(ptr, 0x60)
        }
        slot = uint256(hash) & (size - 1);
        for (uint256 probes; probes < size; ++probes) {
            uint256 row = p.slots[slot];
            if (row == 0) return slot;
            StateStore.Change memory c = p.changes[row - 1];
            if (c.kind == kind && c.key == key && c.index == index) return slot;
            slot = (slot + 1) & (size - 1);
        }
        assert(false);
    }

    function get(StateStore.Store storage s, Plan memory p, StateStore.Kind kind, bytes32 key, uint64 index)
        internal
        view
        returns (bytes memory value)
    {
        (value,) = journalRead(s, p, kind, key, index);
    }

    function journalRead(StateStore.Store storage s, Plan memory p, StateStore.Kind kind, bytes32 key, uint64 index)
        private
        view
        returns (bytes memory value, uint256 slot)
    {
        if (p.slots.length != 0) {
            slot = journalSlot(p, kind, key, index);
            uint256 row = p.slots[slot];
            if (row != 0) return (p.changes[row - 1].afterValue, slot);
        }
        return (StateStore.read(s, kind, key, index), slot);
    }

    function put(
        StateStore.Store storage s,
        Plan memory p,
        StateStore.Kind kind,
        bytes32 key,
        uint64 index,
        bytes memory value
    ) internal view {
        assert(p.length < p.changes.length);
        (bytes memory beforeValue, uint256 slot) = journalRead(s, p, kind, key, index);
        p.changes[p.length++] = StateStore.Change(kind, key, index, beforeValue, value);
        p.slots[slot] = p.length;
    }

    function next(uint64 n) private pure returns (uint64) {
        if (n >= GUARD - 1) revert U48_GUARD();
        return n + 1;
    }

    function occKey(bytes32 envelopeId, uint16 leaf) internal pure returns (bytes32) {
        return keccak256(abi.encode(keccak256("efs2/occurrence/1"), envelopeId, uint256(leaf)));
    }

    function ids(Plan memory p) private pure returns (BindingFold.KernelIds memory) {
        return BindingFold.KernelIds(p.init.bindingSetType, p.init.bindingTombstoneType, p.init.withdrawalType);
    }
}
