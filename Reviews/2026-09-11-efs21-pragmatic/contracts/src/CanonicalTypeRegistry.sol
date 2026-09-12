// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {Preparation} from "C0Core/Preparation.sol";
import {BindingFold} from "C0Core/BindingFold.sol";
import {TypeGroupParser} from "C0Admission/TypeGroupParser.sol";
import {CanonicalHelperIdentity} from "./CanonicalHelperIdentity.sol";

/// @notice Disposable reference-free structural registry, not authored Core admission.
/// Exact canonical declarations are retained; declared indexes are unsupported here.
contract CanonicalTypeRegistry {
    struct TypeInfo {
        bytes32 groupId;
        uint16 memberIndex;
        bytes32 blobHash;
        address cacheCode;
        uint32 cacheLength;
        bytes32 cacheHash;
    }

    struct Group {
        bytes raw;
        bytes32[] ids;
    }
    mapping(bytes32 => Group) private groups;
    mapping(bytes32 => TypeInfo) private types;
    address public immutable helper;
    uint256 public constant MAX_BODY = 4096;
    bytes32 private constant DOM_GROUP = keccak256("efs2/typeschema-group/1");
    bytes32 private constant DOM_TYPE = keccak256("efs2/typeschema/1");
    error UnknownGroup();
    error UnknownType();
    error CorruptCache();
    error UnsupportedReferences();
    error UnsupportedIndexes();
    error ReservedType();
    error BodyTooLarge();

    constructor(address target) {
        if (target.code.length == 0 || target.codehash != CanonicalHelperIdentity.EXPECTED_RUNTIME_HASH) {
            revert Preparation.HelperIdentity();
        }
        helper = target;
    }

    function config() private view returns (Preparation.Config memory) {
        return Preparation.Config(helper, CanonicalHelperIdentity.EXPECTED_RUNTIME_HASH);
    }

    function registerGroup(bytes calldata raw) external returns (bytes32 groupId, bytes32[] memory typeIds) {
        Preparation.CompiledGroup memory g = Preparation.group(config(), raw);
        groupId = keccak256(abi.encode(DOM_GROUP, keccak256(raw)));
        if (g.rawHash != keccak256(raw) || g.groupHash != groupId) revert Preparation.InvalidPreparation();
        if (g.dependencies.length != 0) revert UnsupportedReferences();
        bytes32[] memory blobs = blobHashes(raw);
        if (g.types.length != blobs.length) revert Preparation.InvalidPreparation();
        typeIds = new bytes32[](g.types.length);
        bool exists = groups[groupId].raw.length != 0;
        if (
            exists && (keccak256(groups[groupId].raw) != keccak256(raw) || groups[groupId].ids.length != typeIds.length)
        ) {
            revert CorruptCache();
        }
        // No CREATE or registry write until every member has passed this loop.
        for (uint256 i; i < typeIds.length; ++i) {
            bytes32 id = keccak256(abi.encode(DOM_TYPE, groupId, i));
            requireNotReserved(id);
            bytes memory cache = g.types[i].cacheBytes;
            if (cache.length == 0 || cache.length > Preparation.CACHE_CODE_MAX) revert Preparation.HelperDeploy();
            TypeGroupParser.SchemaCache memory s = abi.decode(cache, (TypeGroupParser.SchemaCache));
            if (g.types[i].typeId != id || s.typeId != id || s.blobHash != blobs[i]) {
                revert Preparation.InvalidPreparation();
            }
            supported(s);
            typeIds[i] = id;
            if (exists) {
                (TypeInfo memory info, bytes memory prior,) = checked(id);
                if (info.groupId != groupId || info.memberIndex != i || keccak256(prior) != keccak256(cache)) {
                    revert CorruptCache();
                }
            } else if (types[id].groupId != bytes32(0)) {
                revert CorruptCache();
            }
        }
        if (exists) return (groupId, typeIds);
        TypeInfo[] memory pending = new TypeInfo[](typeIds.length);
        for (uint256 i; i < typeIds.length; ++i) {
            bytes memory cache = g.types[i].cacheBytes;
            address pointer = Preparation.deployCache(config(), cache);
            // Bound checked before narrowing; exact bytes returned by the pinned helper.
            // forge-lint: disable-next-line(unsafe-typecast)
            pending[i] = TypeInfo(groupId, uint16(i), blobs[i], pointer, uint32(cache.length), keccak256(cache));
            readCode(pending[i]);
        }
        groups[groupId].raw = raw;
        groups[groupId].ids = typeIds;
        for (uint256 i; i < typeIds.length; ++i) {
            types[typeIds[i]] = pending[i];
        }
    }

    function groupBytes(bytes32 groupId) external view returns (bytes memory raw) {
        raw = groups[groupId].raw;
        if (raw.length == 0) revert UnknownGroup();
        if (keccak256(abi.encode(DOM_GROUP, keccak256(raw))) != groupId) revert CorruptCache();
    }

    function typeInfo(bytes32 id) external view returns (TypeInfo memory info) {
        (info,,) = checked(id);
    }

    function cacheBytes(bytes32 id) external view returns (bytes memory raw) {
        (, raw,) = checked(id);
    }

    function isUint256(bytes32 id) external view returns (bool) {
        (,, TypeGroupParser.SchemaCache memory s) = checked(id);
        return s.fields.length == 1 && s.fields[0].kind == 2 && s.fields[0].widthOrMax == 32 && s.maxBodyBytes == 32
            && s.roles.length == 0 && s.indexes.length == 0 && s.constraints.length == 0;
    }

    function validate(bytes32 id, bytes calldata body) external view {
        requireNotReserved(id);
        if (body.length > MAX_BODY) revert BodyTooLarge();
        (, bytes memory cache, TypeGroupParser.SchemaCache memory s) = checked(id);
        supported(s);
        Preparation.PreparedRecord memory p = Preparation.record(
            config(),
            cache,
            id,
            body,
            keccak256(abi.encode(keccak256("efs2/record/1"), id, keccak256(body))),
            bytes32(0),
            BindingFold.KernelIds(0, 0, 0),
            true
        );
        if (p.references.length != 0 || p.occurrenceKeys.length != 0 || p.effect.kind != 0) {
            revert Preparation.InvalidPreparation();
        }
    }

    function supported(TypeGroupParser.SchemaCache memory s) private pure {
        // roles also covers reference-bearing zero-capacity ARRAY schemas.
        if (s.roles.length != 0) revert UnsupportedReferences();
        for (uint256 i; i < s.fields.length; ++i) {
            if (s.fields[i].references != 0) revert UnsupportedReferences();
        }
        if (s.indexes.length != 0) revert UnsupportedIndexes();
    }

    function checked(bytes32 id)
        private
        view
        returns (TypeInfo memory info, bytes memory raw, TypeGroupParser.SchemaCache memory s)
    {
        requireNotReserved(id);
        info = types[id];
        if (info.groupId == bytes32(0)) revert UnknownType();
        Group storage g = groups[info.groupId];
        if (
            g.raw.length == 0 || info.memberIndex >= g.ids.length || g.ids[info.memberIndex] != id
                || keccak256(abi.encode(DOM_TYPE, info.groupId, uint256(info.memberIndex))) != id
                || keccak256(abi.encode(DOM_GROUP, keccak256(g.raw))) != info.groupId
        ) revert CorruptCache();
        bytes32[] memory blobs = blobHashes(g.raw);
        if (blobs.length != g.ids.length || info.blobHash != blobs[info.memberIndex]) revert CorruptCache();
        raw = readCode(info);
        s = abi.decode(raw, (TypeGroupParser.SchemaCache));
        if (s.typeId != id || s.blobHash != info.blobHash) revert CorruptCache();
    }

    function readCode(TypeInfo memory info) private view returns (bytes memory raw) {
        uint256 n = info.cacheLength;
        address pointer = info.cacheCode;
        if (n == 0 || n > Preparation.CACHE_CODE_MAX || pointer.code.length != n + 1) revert CorruptCache();
        uint256 prefix;
        assembly ("memory-safe") {
            extcodecopy(pointer, 0, 0, 1)
            prefix := byte(0, mload(0))
        }
        if (prefix != 0) revert CorruptCache();
        raw = new bytes(n);
        assembly ("memory-safe") { extcodecopy(pointer, add(raw, 32), 1, n) }
        if (keccak256(raw) != info.cacheHash) revert CorruptCache();
    }

    function blobHashes(bytes memory raw) private pure returns (bytes32[] memory hashes) {
        if (raw.length < 2 || raw.length > 8190) revert CorruptCache();
        uint256 count = uint256(uint8(raw[0])) * 256 + uint8(raw[1]);
        if (count == 0 || count > 16) revert CorruptCache();
        hashes = new bytes32[](count);
        uint256 pos = 2;
        for (uint256 i; i < count; ++i) {
            if (raw.length - pos < 2) revert CorruptCache();
            uint256 n = uint256(uint8(raw[pos])) * 256 + uint8(raw[pos + 1]);
            pos += 2;
            if (n > raw.length - pos) revert CorruptCache();
            bytes32 hash;
            assembly ("memory-safe") { hash := keccak256(add(add(raw, 32), pos), n) }
            hashes[i] = hash;
            pos += n;
        }
        if (pos != raw.length) revert CorruptCache();
    }

    function requireNotReserved(bytes32 id) private pure {
        // Exact full fixture identities, not a reservation of names or copied shapes.
        if (
            id == 0x3d40b6b53db7885be062d89270f41085fa8c59738cbc66fe28857d0573ef3a91
                || id == 0xd9a17f2bdf9d885520b42b39778ec88f792b9b5a4fe0851cc388b2932b31add1
                || id == 0xc8261b4f9cd91e465be894c8fc41f45bc5a221b08db1ef8a610325b439b9c605
                || id == 0x8579a7ae3b45b341133398999f7113e2abf5d01c5f8a4f78b3d7927dd754293d
        ) revert ReservedType();
    }
}
