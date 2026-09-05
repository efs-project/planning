// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import {TypeGroupParser} from "./TypeGroupParser.sol";

/// @notice Disposable partial-C0 admission experiment. Not a production Core.
contract AdmissionProbe {
    error InvalidInput();
    error InvalidAuthority();
    error InvalidSequence();
    error Expired();
    error InventoryMismatch();
    error CacheConflict();

    bytes32 private constant ENV_TYPEHASH = keccak256("PublicationEnvelope(uint16 profile,bytes32 principalId,bytes32 authorityRef,uint64 authEpoch,bytes32 pubNonce,uint64 notAfter,bytes32[] recordIds)");
    bytes32 private constant EFFECTS_TYPEHASH = keccak256("C0RealmEffects(bytes32 realmId,address core,bytes32 routeConfigId,bytes32 genesisReceiptHash,uint8 operationKind,bytes32 envelopeId,uint64 leafMask,bytes32 expectedRevisionsHash,address stateByteStore,bytes32 byteCommitment)");
    bytes32 private constant PLAN_TYPEHASH = keccak256("WritePlan(bytes32 c0ProfileId,bytes32 publicationDigest,bytes32 realmId,bytes32 realmEffectsDigest,address executor,bytes32 executorCodeHash,uint192 nonceKey,uint64 nonceSeq,uint64 notAfter)");
    uint256 private constant HALF_N = 0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0;
    struct Config {
        bytes32 realmId;
        address stateByteStore;
        address schemaAuthor;
        address bootstrapAuthor;
        bytes32[4] groupByteHashes;
    }
    struct EnvelopeHeader {
        uint16 profile;
        bytes32 principalId;
        bytes32 authorityRef;
        uint64 authEpoch;
        bytes32 pubNonce;
        uint64 notAfter;
    }
    struct C0RealmEffects {
        bytes32 realmId;
        address core;
        bytes32 routeConfigId;
        bytes32 genesisReceiptHash;
        uint8 operationKind;
        bytes32 envelopeId;
        uint64 leafMask;
        bytes32 expectedRevisionsHash;
        address stateByteStore;
        bytes32 byteCommitment;
    }
    struct WritePlan {
        bytes32 c0ProfileId;
        bytes32 publicationDigest;
        bytes32 realmId;
        bytes32 realmEffectsDigest;
        address executor;
        bytes32 executorCodeHash;
        uint192 nonceKey;
        uint64 nonceSeq;
        uint64 notAfter;
    }
    struct RecordRow { bytes32 typeId; bytes body; uint64 ordinal; }
    struct EnvelopeRow {
        bytes unsignedStatement; bytes effects; bytes plan; bytes witness;
        bytes32 principalId; uint64 ordinal;
    }
    struct AdmissionRow {
        bytes32 envelopeId; uint16 leafIndex; bytes32 recordId;
        bytes32 principalId; uint64 ordinal; uint48 admittedAtBlock;
        uint64 admittedAtTimestamp; bytes32 witnessProfile;
        uint192 nonceKey; uint64 nonceSeq;
    }
    struct TypeRow {
        bytes32 groupRecordId; uint16 memberIndex; uint64 ordinal;
        uint64 admittedAtOrdinal; bytes cacheBytes;
    }

    bytes32 public immutable realmId;
    address public immutable stateByteStore;
    address public immutable schemaAuthor;
    address public immutable bootstrapAuthor;
    bytes32 public immutable metaTypeId;
    bytes32 public immutable probeCommitment;
    bytes32 public immutable c0ProfileId;
    bytes32[4] public inventory;
    bytes public intrinsicGroupBytes;
    bytes public declarationInventoryBytes;
    uint8 public admittedGroupCount;
    uint64 public admissionCount;
    uint64 public recordCount;
    uint64 public envelopeCount;
    mapping(bytes32 => RecordRow) private records;
    mapping(bytes32 => EnvelopeRow) private envelopes;
    mapping(bytes32 => AdmissionRow) private admissions;
    mapping(bytes32 => TypeRow) private types;
    mapping(bytes32 => bytes) public principalDescriptor;
    mapping(bytes32 => mapping(uint192 => uint64)) public lastSequence;
    mapping(uint8 => mapping(bytes32 => bytes32[])) private indexes;

    constructor(Config memory c, bytes memory intrinsicGroup, bytes memory declarations) {
        if (c.realmId == 0 || c.stateByteStore == address(0) || c.schemaAuthor == address(0)
            || c.bootstrapAuthor == address(0) || c.schemaAuthor == c.bootstrapAuthor
            || declarations.length == 0 || declarations.length > 4096) revert InvalidInput();
        for (uint256 i; i < 4; ++i) {
            if (c.groupByteHashes[i] == 0) revert InvalidInput();
            for (uint256 j; j < i; ++j) if (c.groupByteHashes[i] == c.groupByteHashes[j]) revert InvalidInput();
        }
        (, TypeGroupParser.SchemaCache[] memory intrinsic) = TypeGroupParser.parse(intrinsicGroup, new bytes32[](0));
        if (intrinsic.length != 1 || intrinsic[0].fields.length != 1 || intrinsic[0].roles.length != 0
            || intrinsic[0].indexes.length != 0 || intrinsic[0].constraints.length != 0
            || keccak256(intrinsic[0].fields[0].descriptor) != keccak256(hex"000a67726f75704279746573051ffe")) revert InvalidInput();
        realmId = c.realmId;
        stateByteStore = c.stateByteStore;
        schemaAuthor = c.schemaAuthor;
        bootstrapAuthor = c.bootstrapAuthor;
        inventory = c.groupByteHashes;
        intrinsicGroupBytes = intrinsicGroup;
        declarationInventoryBytes = declarations;
        metaTypeId = intrinsic[0].typeId;
        types[metaTypeId] = TypeRow(0, 0, 1, 0, abi.encode(intrinsic[0]));
        indexes[1][0].push(metaTypeId);
        probeCommitment = keccak256(abi.encode(keccak256("efs2/c0-admission-probe/run/1"), c.realmId,
            c.stateByteStore, c.schemaAuthor, c.bootstrapAuthor, c.groupByteHashes,
            keccak256(intrinsicGroup), keccak256(declarations)));
        c0ProfileId = keccak256(abi.encode(keccak256("efs2/mvp-c0/profile/1"), probeCommitment));
    }

    function publishWithPlanC0(EnvelopeHeader calldata p, bytes32[] calldata recordIds, bytes calldata body,
        C0RealmEffects calldata e, WritePlan calldata plan, bytes calldata witness) external returns (uint8, uint64) {
        // Closed one-leaf admission subset. Validate all signed bindings before state changes.
        if (recordIds.length != 1 || body.length < 4 || body.length > 8192
            || uint256(uint16(bytes2(body[:2]))) != body.length - 2) revert InvalidInput();
        bytes32 recordId = keccak256(abi.encode(keccak256("efs2/record/1"), metaTypeId, keccak256(body)));
        if (recordIds[0] != recordId || p.profile != 1 || p.authorityRef != 0 || p.authEpoch != 0) revert InvalidInput();
        bytes32 publicationDigest = publicationHash(p, recordIds);
        bytes32 envelopeId = keccak256(abi.encode(keccak256("efs2/envelope/1"), publicationDigest));
        if (e.realmId != realmId || e.core != address(this) || e.routeConfigId != 0 || e.genesisReceiptHash != 0
            || e.operationKind != 1 || e.envelopeId != envelopeId || e.leafMask != 1
            || e.expectedRevisionsHash != keccak256("") || e.stateByteStore != stateByteStore || e.byteCommitment != 0
            || plan.c0ProfileId != c0ProfileId || plan.publicationDigest != publicationDigest || plan.realmId != realmId
            || plan.realmEffectsDigest != keccak256(abi.encode(EFFECTS_TYPEHASH, e))
            || plan.executor != address(this) || plan.executorCodeHash != address(this).codehash
            || plan.notAfter != p.notAfter) revert InvalidInput();
        authenticate(p.principalId, plan, witness);
        bytes32 occurrenceKey = keccak256(abi.encode(keccak256("efs2/occurrence/1"), envelopeId, uint256(0)));
        uint64 oldOrdinal = admissions[occurrenceKey].ordinal;
        // Exact authenticated retry does not reinterpret history through today's nonce or expiry.
        if (oldOrdinal != 0) return (2, oldOrdinal);
        if (plan.notAfter != 0 && block.timestamp > plan.notAfter) revert Expired();
        uint64 last = lastSequence[p.principalId][plan.nonceKey];
        if (last == type(uint64).max || plan.nonceSeq != last + 1) revert InvalidSequence();
        if (admissionCount >= type(uint48).max || block.number > type(uint48).max
            || block.timestamp > type(uint64).max) revert InvalidInput();

        bytes memory group = body[2:];
        bool freshRecord = records[recordId].ordinal == 0;
        if (freshRecord && (admittedGroupCount >= 4 || keccak256(group) != inventory[admittedGroupCount])) revert InventoryMismatch();
        (, TypeGroupParser.SchemaCache[] memory schemas) = TypeGroupParser.parse(group, indexes[1][0]);
        if (freshRecord) {
            uint256 expectedCount = admittedGroupCount == 0 || admittedGroupCount == 2 ? 6 : admittedGroupCount == 1 ? 3 : 1;
            if (schemas.length != expectedCount) revert InventoryMismatch();
        }
        // Cache parsing, comparison, rows and postings are all in the same reverting frame.
        uint64 ordinal = admissionCount + 1;
        for (uint256 i; i < schemas.length; ++i) {
            bytes32 typeId = schemas[i].typeId;
            bytes memory cache = abi.encode(schemas[i]);
            TypeRow storage old = types[typeId];
            if (old.ordinal != 0) {
                if (old.groupRecordId != recordId || old.memberIndex != i || keccak256(old.cacheBytes) != keccak256(cache)) revert CacheConflict();
            } else {
                if (!freshRecord) revert CacheConflict();
                uint64 typeOrdinal = uint64(indexes[1][0].length + 1);
                types[typeId] = TypeRow(recordId, uint16(i), typeOrdinal, ordinal, cache);
                indexes[1][0].push(typeId);
            }
        }
        if (freshRecord) {
            records[recordId] = RecordRow(metaTypeId, body, ++recordCount);
            indexes[3][metaTypeId].push(recordId);
            ++admittedGroupCount;
        }
        if (principalDescriptor[p.principalId].length == 0) {
            principalDescriptor[p.principalId] = abi.encodePacked(hex"0100", schemaAuthor);
            indexes[2][0].push(p.principalId);
        }
        envelopes[envelopeId] = EnvelopeRow(abi.encode(p, recordIds), abi.encode(e), abi.encode(plan), witness,
            p.principalId, ++envelopeCount);
        admissions[occurrenceKey] = AdmissionRow(envelopeId, 0, recordId, p.principalId, ordinal,
            uint48(block.number), uint64(block.timestamp), keccak256("C0_COMPOSITE_EOA_V1"), plan.nonceKey, plan.nonceSeq);
        indexes[4][metaTypeId].push(occurrenceKey);
        indexes[5][recordId].push(occurrenceKey);
        indexes[6][p.principalId].push(occurrenceKey);
        indexes[7][0].push(occurrenceKey);
        admissionCount = ordinal;
        lastSequence[p.principalId][plan.nonceKey] = plan.nonceSeq;
        return (1, ordinal);
    }

    function publicationHash(EnvelopeHeader calldata p, bytes32[] calldata ids) private pure returns (bytes32) {
        bytes32 domain = keccak256(abi.encode(keccak256("EIP712Domain(string name,string version)"),
            keccak256("EFS2-Envelope"), keccak256("1")));
        bytes32 statement = keccak256(abi.encode(ENV_TYPEHASH, p.profile, p.principalId, p.authorityRef,
            p.authEpoch, p.pubNonce, p.notAfter, keccak256(abi.encodePacked(ids))));
        return keccak256(abi.encodePacked(hex"1901", domain, statement));
    }

    function authenticate(bytes32 principal, WritePlan calldata plan, bytes calldata signature) private view {
        if (signature.length != 65) revert InvalidAuthority();
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly ("memory-safe") {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 32))
            v := byte(0, calldataload(add(signature.offset, 64)))
        }
        if (uint256(s) == 0 || uint256(s) > HALF_N || (v != 27 && v != 28)) revert InvalidAuthority();
        bytes32 domain = keccak256(abi.encode(keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
            keccak256("EFS2-MVP-C0-WritePlan"), keccak256("1"), block.chainid, address(this)));
        bytes32 digest = keccak256(abi.encodePacked(hex"1901", domain, keccak256(abi.encode(PLAN_TYPEHASH, plan))));
        address recovered = ecrecover(digest, v, r, s);
        if (recovered == address(0) || recovered != schemaAuthor || principal != keccak256(abi.encode(
            keccak256("efs2/principal/1"), uint256(1), keccak256(abi.encodePacked(hex"0100", recovered))))) revert InvalidAuthority();
    }
    function getRecord(bytes32 id) external view returns (RecordRow memory) { return records[id]; }
    function getEnvelope(bytes32 id) external view returns (EnvelopeRow memory) { return envelopes[id]; }
    function getAdmission(bytes32 id) external view returns (AdmissionRow memory) { return admissions[id]; }
    function getTypeCache(bytes32 id) external view returns (TypeRow memory) { return types[id]; }
    function indexLength(uint8 kind, bytes32 key) external view returns (uint256) {
        validIndex(kind, key);
        return indexes[kind][key].length;
    }
    function indexAt(uint8 kind, bytes32 key, uint256 i) external view returns (bytes32) {
        validIndex(kind, key);
        return indexes[kind][key][i];
    }
    function validIndex(uint8 kind, bytes32 key) private pure {
        if (kind < 1 || kind > 7 || ((kind == 1 || kind == 2 || kind == 7) && key != 0)) revert InvalidInput();
    }
}
