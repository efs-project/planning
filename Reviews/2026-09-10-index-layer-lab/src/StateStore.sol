// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

library StateStore {
    struct Counts {
        uint64 records;
        uint64 envelopes;
        uint64 types;
        uint64 principals;
        uint64 admissions;
        uint64 batches;
        uint64 postingKeys;
        uint64 bindingKeys;
    }

    struct RecordRow {
        bytes32 typeId;
        bytes body;
        uint64 recordOrdinal;
        uint64 firstAdmissionOrdinal;
    }

    struct EnvelopeRow {
        bytes canonicalUnsignedEnvelope;
        uint64 envelopeOrdinal;
    }

    struct TypeRow {
        bytes32 groupRecordId;
        uint16 memberIndex;
        uint64 typeOrdinal;
        uint64 admittedAtOrdinal;
        bytes cacheBytes;
    }

    struct PrincipalRow {
        uint64 principalOrdinal;
        uint64 firstAdmissionOrdinal;
    }

    struct AdmissionRow {
        bytes32 envelopeId;
        uint256 packed;
    }

    struct LifecycleRow {
        uint256 packed;
    }

    struct BindingRow {
        uint256 meta;
        bytes32 target;
    }

    struct PostingRow {
        uint256 head;
    }

    struct BatchRow {
        uint256 meta;
        uint256 authorityBasis;
        bytes32 authorityCodehash;
    }

    struct Bootstrap {
        bytes32 realmId;
        bytes32 initialRevisionId;
        bytes intrinsicGroupBytes;
        bytes32 objectGroup1Hash;
        bytes32 kernelGroup2Hash;
        bytes32 metaTypeId;
        bytes32 objectGenesisType;
        bytes32 bindingSetType;
        bytes32 bindingTombstoneType;
        bytes32 withdrawalType;
    }

    struct Store {
        Counts count;
        Bootstrap init;
        mapping(bytes32 => RecordRow) records;
        mapping(bytes32 => EnvelopeRow) envelopes;
        mapping(bytes32 => TypeRow) types;
        mapping(bytes32 => PrincipalRow) principals;
        mapping(uint64 => AdmissionRow) admissions;
        mapping(bytes32 => LifecycleRow) occurrences;
        mapping(bytes32 => BindingRow) bindings;
        mapping(bytes32 => PostingRow) postings;
        mapping(bytes32 => mapping(uint64 => uint256)) postingWords;
        mapping(uint64 => BatchRow) batches;
        mapping(uint64 => bytes32) recordIds;
        mapping(uint64 => bytes32) envelopeIds;
        mapping(uint64 => bytes32) typeIds;
        mapping(uint64 => bytes32) principalIds;
        mapping(uint64 => bytes32) postingKeys;
        mapping(uint64 => bytes32) bindingKeys;
        // Disposable comparison arm: 0 = legacy admission anchors; 1 = K10 key ordinals.
        // Appended, never reinterpret a populated Store.
        uint256 scopeLayout;
    }

    // The write-free planner journals only rows touched by the bounded selected
    // carriage. Every replay entry retains its exact prestate and after-value.
    enum Kind {
        Record,
        Envelope,
        Type,
        Principal,
        Admission,
        Lifecycle,
        Binding,
        Posting,
        Word,
        Batch,
        RecordId,
        EnvelopeId,
        TypeId,
        PrincipalId,
        PostingKey,
        BindingKey
    }

    struct Change {
        Kind kind;
        bytes32 key;
        uint64 index;
        bytes beforeValue;
        bytes afterValue;
    }

    function read(Store storage s, Kind k, bytes32 key, uint64 i) internal view returns (bytes memory) {
        if (k == Kind.Record) return abi.encode(s.records[key]);
        if (k == Kind.Envelope) return abi.encode(s.envelopes[key]);
        if (k == Kind.Type) return abi.encode(s.types[key]);
        if (k == Kind.Principal) return abi.encode(s.principals[key]);
        if (k == Kind.Admission) return abi.encode(s.admissions[i]);
        if (k == Kind.Lifecycle) return abi.encode(s.occurrences[key]);
        if (k == Kind.Binding) return abi.encode(s.bindings[key]);
        if (k == Kind.Posting) return abi.encode(s.postings[key]);
        if (k == Kind.Word) return abi.encode(s.postingWords[key][i]);
        if (k == Kind.Batch) return abi.encode(s.batches[i]);
        if (k == Kind.RecordId) return abi.encode(s.recordIds[i]);
        if (k == Kind.EnvelopeId) return abi.encode(s.envelopeIds[i]);
        if (k == Kind.TypeId) return abi.encode(s.typeIds[i]);
        if (k == Kind.PrincipalId) return abi.encode(s.principalIds[i]);
        if (k == Kind.PostingKey) return abi.encode(s.postingKeys[i]);
        return abi.encode(s.bindingKeys[i]);
    }

    function replay(Store storage s, Change memory c) internal {
        assert(keccak256(read(s, c.kind, c.key, c.index)) == keccak256(c.beforeValue));
        bytes memory v = c.afterValue;
        bytes32 key = c.key;
        uint64 i = c.index;
        Kind k = c.kind;
        if (k == Kind.Record) s.records[key] = abi.decode(v, (RecordRow));
        else if (k == Kind.Envelope) s.envelopes[key] = abi.decode(v, (EnvelopeRow));
        else if (k == Kind.Type) s.types[key] = abi.decode(v, (TypeRow));
        else if (k == Kind.Principal) s.principals[key] = abi.decode(v, (PrincipalRow));
        else if (k == Kind.Admission) s.admissions[i] = abi.decode(v, (AdmissionRow));
        else if (k == Kind.Lifecycle) s.occurrences[key] = abi.decode(v, (LifecycleRow));
        else if (k == Kind.Binding) s.bindings[key] = abi.decode(v, (BindingRow));
        else if (k == Kind.Posting) s.postings[key] = abi.decode(v, (PostingRow));
        else if (k == Kind.Word) s.postingWords[key][i] = abi.decode(v, (uint256));
        else if (k == Kind.Batch) s.batches[i] = abi.decode(v, (BatchRow));
        else if (k == Kind.RecordId) s.recordIds[i] = abi.decode(v, (bytes32));
        else if (k == Kind.EnvelopeId) s.envelopeIds[i] = abi.decode(v, (bytes32));
        else if (k == Kind.TypeId) s.typeIds[i] = abi.decode(v, (bytes32));
        else if (k == Kind.PrincipalId) s.principalIds[i] = abi.decode(v, (bytes32));
        else if (k == Kind.PostingKey) s.postingKeys[i] = abi.decode(v, (bytes32));
        else s.bindingKeys[i] = abi.decode(v, (bytes32));
    }
}
