// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Preparation} from "./Preparation.sol";
import {StorageByteView} from "./StorageByteView.sol";

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

    /// One word; fresh-state experiment only, not a populated-state migration.
    /// Payload offset is deliberately zero in this envelope-only profile.
    struct EnvelopeCell {
        address pointer;
        uint16 offset;
        uint16 length;
        uint64 envelopeOrdinal;
    }

    /// @notice The logical type row: what admission applies and
    /// what `typeRow` views return. `cacheBytes` is the compiled
    /// schema cache exactly as the preparation helper produced it.
    struct TypeRow {
        bytes32 groupRecordId;
        uint16 memberIndex;
        uint64 typeOrdinal;
        uint64 admittedAtOrdinal;
        bytes cacheBytes;
    }

    /// @notice The stored type row. The compiled cache is not kept in storage
    /// slots: it is deployed once, at type admission, as the immutable runtime
    /// code at `cacheCode` (one STOP byte followed by the cache) by the pinned
    /// preparation helper from ITS account (never from the core's, whose nonce
    /// proxy tooling predicts), and loaded with EXTCODECOPY on every admission
    /// and checked read. Three slots, as before; no data words.
    struct TypeCell {
        bytes32 groupRecordId;
        uint16 memberIndex;
        uint64 typeOrdinal;
        uint64 admittedAtOrdinal;
        address cacheCode;
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
        mapping(bytes32 => EnvelopeCell) envelopes;
        mapping(bytes32 => TypeCell) types;
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
    }

    // Ordered row dispatcher shared by direct admission reads and writes.
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

    // TypeCell layout (asserted by the read tests through the Solidity accessors):
    //   slot 0  groupRecordId
    //   slot 1  memberIndex (bits 0-15) | typeOrdinal (16-79) | admittedAtOrdinal (80-143)
    //   slot 2  cacheCode
    /// The logical row of a type: scalar fields from the cell, the cache from code.
    function typeRow(Store storage s, bytes32 id) internal view returns (TypeRow memory row) {
        TypeCell storage c = s.types[id];
        bytes32 group;
        uint256 packed;
        address code;
        assembly ("memory-safe") {
            group := sload(c.slot)
            packed := sload(add(c.slot, 1))
            code := shr(96, shl(96, sload(add(c.slot, 2))))
        }
        row.groupRecordId = group;
        row.memberIndex = uint16(packed);
        row.typeOrdinal = uint64(packed >> 16);
        row.admittedAtOrdinal = uint64(packed >> 80);
        row.cacheBytes = cacheBytes(code);
    }

    /// The whole cache behind `cacheCode`, byte-identical to what was admitted
    /// (empty for the null pointer). A cell pointing at an account without code
    /// is an impossible state and asserts.
    function cacheBytes(address cacheCode) internal view returns (bytes memory out) {
        if (cacheCode == address(0)) return out;
        // An account without code is an impossible state: the decrement panics.
        uint256 n = cacheCode.code.length - 1;
        out = new bytes(n);
        assembly ("memory-safe") {
            extcodecopy(cacheCode, add(out, 32), 1, n)
        }
    }

    /// Stores a logical row whose cache the caller has already deployed at
    /// `cacheCode` (address(0) for an empty cache).
    function writeType(Store storage s, bytes32 id, TypeRow memory row, address cacheCode) internal {
        writeCell(
            s,
            id,
            row.groupRecordId,
            uint256(row.memberIndex) | (uint256(row.typeOrdinal) << 16) | (uint256(row.admittedAtOrdinal) << 80),
            cacheCode
        );
    }

    function writeCell(Store storage s, bytes32 id, bytes32 group, uint256 packed, address cacheCode) private {
        TypeCell storage c = s.types[id];
        assembly ("memory-safe") {
            sstore(c.slot, group)
            sstore(add(c.slot, 1), packed)
            sstore(add(c.slot, 2), cacheCode)
        }
    }

    function envelopeOrdinal(Store storage s, bytes32 id) internal view returns (uint64) {
        return s.envelopes[id].envelopeOrdinal;
    }

    function envelopeLength(EnvelopeCell memory c, bytes32 subject) internal view returns (uint256 n) {
        n = c.length;
        if (c.envelopeOrdinal == 0) {
            if (c.pointer != address(0) || c.offset != 0 || n != 0) revert StorageByteView.ErrReadState(subject);
            return 0;
        }
        if (n < 288 || n > 2304 || c.offset != 0 || c.pointer == address(0) || c.pointer.code.length != n + 1) {
            revert StorageByteView.ErrReadState(subject);
        }
        address pointer = c.pointer;
        uint256 first;
        assembly ("memory-safe") {
            extcodecopy(pointer, 0, 0, 1)
            first := byte(0, mload(0))
        }
        if (first != 0) revert StorageByteView.ErrReadState(subject);
    }

    function envelopeWord(Store storage s, bytes32 id, uint256 offset, bytes32 subject)
        internal
        view
        returns (uint256 result)
    {
        EnvelopeCell memory c = s.envelopes[id];
        uint256 n = envelopeLength(c, subject);
        if (offset & 31 != 0 || offset > n || 32 > n - offset) revert StorageByteView.ErrReadState(subject);
        address pointer = c.pointer;
        assembly ("memory-safe") {
            extcodecopy(pointer, 0, add(offset, 1), 32)
            result := mload(0)
        }
    }

    function envelopeSlice(Store storage s, bytes32 id, uint256 start, uint256 length, bytes32 subject)
        internal
        view
        returns (bytes memory out)
    {
        EnvelopeCell memory c = s.envelopes[id];
        uint256 n = envelopeLength(c, subject);
        if (start > n || length > n - start) revert StorageByteView.ErrReadState(subject);
        out = new bytes(length);
        address pointer = c.pointer;
        assembly ("memory-safe") { extcodecopy(pointer, add(out, 32), add(start, 1), length) }
    }

    function envelopeRow(Store storage s, bytes32 id) internal view returns (EnvelopeRow memory row) {
        EnvelopeCell memory c = s.envelopes[id];
        uint256 n = envelopeLength(c, id);
        row.envelopeOrdinal = c.envelopeOrdinal;
        // The checked whole-row path already has the cell and exact extent;
        // do not reload and revalidate it through the general slice accessor.
        bytes memory out = new bytes(n);
        address pointer = c.pointer;
        assembly ("memory-safe") { extcodecopy(pointer, add(out, 32), 1, n) }
        row.canonicalUnsignedEnvelope = out;
    }

    function writeEnvelope(Store storage s, bytes32 id, EnvelopeRow memory row, Preparation.Config memory config)
        internal
    {
        uint256 n = row.canonicalUnsignedEnvelope.length;
        if (row.envelopeOrdinal == 0 || n < 288 || n > 2304) revert StorageByteView.ErrReadState(id);
        // Envelope creation precedes the first preparation invoke: explicitly
        // satisfy deployCache's identity precondition without changing helper code.
        if (config.helper.code.length == 0 || config.helper.codehash != config.codehash) {
            revert Preparation.HelperIdentity();
        }
        address pointer = Preparation.deployCache(config, row.canonicalUnsignedEnvelope);
        // n was bounded before narrowing. Validate returned code before installing the cell.
        // forge-lint: disable-next-line(unsafe-typecast)
        EnvelopeCell memory c = EnvelopeCell(pointer, 0, uint16(n), row.envelopeOrdinal);
        envelopeLength(c, id);
        s.envelopes[id] = c;
    }

    function read(Store storage s, Kind k, bytes32 key, uint64 i) internal view returns (bytes memory) {
        if (k == Kind.Record) return abi.encode(s.records[key]);
        if (k == Kind.Envelope) return abi.encode(envelopeRow(s, key));
        if (k == Kind.Type) return abi.encode(typeRow(s, key));
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

    /// Applies one ordered row immediately. Type cache creation is part of the
    /// same reverting transaction, before any later leaf's validation.
    function applyRow(Store storage s, Kind k, bytes32 key, uint64 i, bytes memory v, Preparation.Config memory config)
        internal
    {
        if (k == Kind.Record) {
            s.records[key] = abi.decode(v, (RecordRow));
        } else if (k == Kind.Envelope) {
            writeEnvelope(s, key, abi.decode(v, (EnvelopeRow)), config);
        } else if (k == Kind.Type) {
            // v = abi.encode(TypeRow), produced by this kernel:
            // [0x20][groupRecordId][memberIndex][typeOrdinal][admittedAtOrdinal][0xa0][length][cache…];
            // the cache is read in place as a bytes value, without a copy.
            bytes32 group;
            uint256 packed;
            bytes memory cache;
            assembly ("memory-safe") {
                group := mload(add(v, 64))
                packed := or(or(mload(add(v, 96)), shl(16, mload(add(v, 128)))), shl(80, mload(add(v, 160))))
                cache := add(v, 224)
            }
            writeCell(s, key, group, packed, Preparation.deployCache(config, cache));
        } else if (k == Kind.Principal) {
            s.principals[key] = abi.decode(v, (PrincipalRow));
        } else if (k == Kind.Admission) {
            s.admissions[i] = abi.decode(v, (AdmissionRow));
        } else if (k == Kind.Lifecycle) {
            s.occurrences[key] = abi.decode(v, (LifecycleRow));
        } else if (k == Kind.Binding) {
            s.bindings[key] = abi.decode(v, (BindingRow));
        } else if (k == Kind.Posting) {
            s.postings[key] = abi.decode(v, (PostingRow));
        } else if (k == Kind.Word) {
            s.postingWords[key][i] = abi.decode(v, (uint256));
        } else if (k == Kind.Batch) {
            s.batches[i] = abi.decode(v, (BatchRow));
        } else if (k == Kind.RecordId) {
            s.recordIds[i] = abi.decode(v, (bytes32));
        } else if (k == Kind.EnvelopeId) {
            s.envelopeIds[i] = abi.decode(v, (bytes32));
        } else if (k == Kind.TypeId) {
            s.typeIds[i] = abi.decode(v, (bytes32));
        } else if (k == Kind.PrincipalId) {
            s.principalIds[i] = abi.decode(v, (bytes32));
        } else if (k == Kind.PostingKey) {
            s.postingKeys[i] = abi.decode(v, (bytes32));
        } else {
            s.bindingKeys[i] = abi.decode(v, (bytes32));
        }
    }
}
