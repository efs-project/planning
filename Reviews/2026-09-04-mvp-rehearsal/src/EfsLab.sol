// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {EfsLabBytes} from "./EfsLabBytes.sol";

/// @notice efs-lab/1 rehearsal only, not EFS Core or C0.
contract EfsLab {
    struct Operation {
        uint8 kind;
        bytes32 target;
        string name;
        bytes32 schemaId;
        bytes data;
        bytes32 salt;
        uint64 expectedRevision;
        uint64 nonce;
        uint64 deadline;
        bytes32 grantId;
    }

    struct Grant {
        address key;
        bytes32 scope;
        uint8 operations;
        uint64 expiry;
        uint32 maxWrites;
        uint64 maxBytes;
        uint64 nonce;
    }

    struct Node {
        uint8 kind;
        bytes32 parent;
        string name;
        uint64 revision;
    }

    struct Revision {
        bytes32 contentId;
        bytes32 previous;
    }

    struct TypedRecord {
        bytes32 schemaId;
        bytes32 contentId;
    }

    struct Receipt {
        bytes operationBytes;
        bytes witness;
        uint8 mode;
        address signer;
        bytes32 resultId;
        uint64 revision;
        uint64 blockNumber;
        uint64 timestamp;
        bytes32 digest;
    }
    address public immutable owner;
    bytes32 public immutable runId;
    bytes32 public immutable rootId;
    EfsLabBytes public immutable byteStore;
    uint64 public ownerNonce;
    uint256 public receiptCount;
    mapping(bytes32 => Node) internal nodes;
    mapping(bytes32 => uint8) private depths;
    mapping(bytes32 => mapping(bytes32 => bytes32)) private childrenByName;
    mapping(bytes32 => bytes32[]) private children;
    mapping(bytes32 => mapping(uint64 => Revision)) private revisions;
    mapping(bytes32 => bytes) private schemaBodies;
    mapping(bytes32 => TypedRecord) private typedRecords;
    bytes32[] private schemaIds;
    bytes32[] private recordIds;
    mapping(uint256 => Receipt) private receipts;

    struct GrantState {
        Grant grant;
        bytes approval;
        bool revoked;
        uint32 writes;
        uint64 payloadBytes;
        uint256 registeredAtReceipt;
        uint256 revokedAtReceipt;
        uint64 registeredBlock;
        uint64 revokedBlock;
        uint64 registeredTimestamp;
        uint64 revokedTimestamp;
    }
    mapping(bytes32 => GrantState) private grants;
    mapping(uint64 => bool) private usedGrantNonces;
    bool private entered;
    error Unauthorized();
    error InvalidOperation();
    error Missing();
    error Bounds();
    error Collision();
    error StaleRevision();
    error InvalidSchema();
    error InvalidData();
    error InvalidSignature();
    event Applied(uint256 indexed ordinal, bytes32 indexed resultId, uint8 kind, bytes32 digest);
    event GrantRegistered(bytes32 indexed grantId);
    event GrantRevoked(bytes32 indexed grantId);
    event SchemaRegistered(bytes32 indexed schemaId);
    bytes32 private constant OP_TYPE = keccak256(
        "Operation(uint8 kind,bytes32 target,string name,bytes32 schemaId,bytes data,bytes32 salt,uint64 expectedRevision,uint64 nonce,uint64 deadline,bytes32 grantId)"
    );
    bytes32 private constant GRANT_TYPE = keccak256(
        "Grant(address key,bytes32 scope,uint8 operations,uint64 expiry,uint32 maxWrites,uint64 maxBytes,uint64 nonce)"
    );
    modifier lock() {
        if (entered) revert Unauthorized();
        entered = true;
        _;
        entered = false;
    }
    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    constructor(address o, bytes32 r) {
        if (o == address(0) || r == 0) revert InvalidOperation();
        owner = o;
        runId = r;
        rootId = keccak256(abi.encode(keccak256("efs-lab/root/1"), r, o));
        nodes[rootId] = Node(1, 0, "", 0);
        byteStore = new EfsLabBytes();
    }

    function getNode(bytes32 id) external view returns (Node memory) {
        if (nodes[id].kind == 0) revert Missing();
        return nodes[id];
    }

    function _typed(bytes32 value) private view returns (bytes32) {
        bytes32 d = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256("efs-lab"),
                keccak256("1"),
                block.chainid,
                address(this)
            )
        );
        return keccak256(abi.encodePacked(hex"1901", d, value));
    }

    function _digest(Operation calldata o) private view returns (bytes32) {
        return _typed(
            keccak256(
                abi.encode(
                    OP_TYPE,
                    o.kind,
                    o.target,
                    keccak256(bytes(o.name)),
                    o.schemaId,
                    keccak256(o.data),
                    o.salt,
                    o.expectedRevision,
                    o.nonce,
                    o.deadline,
                    o.grantId
                )
            )
        );
    }

    function _recover(bytes32 digest, bytes calldata sig) private pure returns (address signer) {
        if (sig.length != 65) revert InvalidSignature();
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := calldataload(sig.offset)
            s := calldataload(add(sig.offset, 32))
            v := byte(0, calldataload(add(sig.offset, 64)))
        }
        if (
            uint256(s) > 0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0 || uint256(s) == 0
                || (v != 27 && v != 28)
        ) revert InvalidSignature();
        signer = ecrecover(digest, v, r, s);
        if (signer == address(0)) revert InvalidSignature();
    }

    function execute(Operation calldata o, bytes calldata signature) external lock returns (bytes32) {
        bytes32 d = _digest(o);
        address signer = _recover(d, signature);
        if (o.grantId == 0) {
            _authorizeOwner(o, signer);
        } else {
            _authorizeSession(o, signer);
        }
        return _apply(o, signature, o.grantId == 0 ? 2 : 3, signer, d);
    }

    function executeDirect(Operation calldata o) external onlyOwner lock returns (bytes32) {
        if (o.grantId != 0 || o.nonce != ownerNonce) revert Unauthorized();
        return _apply(o, "", 1, owner, _digest(o));
    }

    // Keep dispatch free of nested conditionals: an if/else here must never
    // depend on formatter preservation of braces around another if.
    function _authorizeOwner(Operation calldata o, address signer) private view {
        if (signer != owner || o.nonce != ownerNonce) revert Unauthorized();
    }

    function _authorizeSession(Operation calldata o, address signer) private view {
        GrantState storage s = grants[o.grantId];
        Grant storage g = s.grant;
        if (
            signer != g.key || g.key == address(0) || s.revoked || block.timestamp > g.expiry || o.deadline > g.expiry
                || o.nonce != s.writes || s.writes >= g.maxWrites || o.data.length > g.maxBytes - s.payloadBytes
                || o.kind == 0 || o.kind > 3 || (g.operations & (uint8(1) << (o.kind - 1))) == 0
        ) revert Unauthorized();
        bytes32 cursor = o.target;
        for (uint256 i; i <= 16; ++i) {
            if (cursor == g.scope) return;
            if (cursor == 0 || nodes[cursor].kind == 0) break;
            cursor = nodes[cursor].parent;
        }
        revert Unauthorized();
    }

    function _apply(Operation calldata o, bytes memory witness, uint8 mode, address signer, bytes32 d)
        private
        returns (bytes32 id)
    {
        if (o.deadline < block.timestamp || o.data.length > 16384 || o.kind == 0 || o.kind > 4) revert InvalidOperation();
        uint64 revision;
        if (o.kind <= 2) {
            _name(o.name);
            if (
                nodes[o.target].kind != 1 || depths[o.target] >= 16 || children[o.target].length >= 256 || o.salt == 0
                    || o.schemaId != 0 || o.expectedRevision != 0 || (o.kind == 1 && o.data.length != 0)
            ) revert InvalidOperation();
            bytes32 nameHash = keccak256(bytes(o.name));
            if (childrenByName[o.target][nameHash] != 0) revert Collision();
            id = keccak256(abi.encode(keccak256("efs-lab/node/1"), runId, owner, o.kind, o.target, nameHash, o.salt));
            if (nodes[id].kind != 0) revert Collision();
            nodes[id] = Node(o.kind, o.target, o.name, 0);
            depths[id] = depths[o.target] + 1;
            childrenByName[o.target][nameHash] = id;
            children[o.target].push(id);
            if (o.kind == 2) revision = _writeRevision(id, o.data);
        } else if (o.kind == 3) {
            if (nodes[o.target].kind != 2 || bytes(o.name).length != 0 || o.salt != 0 || o.schemaId != 0) revert InvalidOperation();
            if (nodes[o.target].revision != o.expectedRevision) revert StaleRevision();
            id = o.target;
            revision = _writeRevision(id, o.data);
        } else {
            if (o.target != rootId || bytes(o.name).length != 0 || o.salt != 0 || o.expectedRevision != 0) revert InvalidOperation();
            _validate(o.schemaId, o.data);
            id = keccak256(abi.encode(keccak256("efs-lab/record/1"), o.schemaId, keccak256(o.data)));
            bytes32 contentId = byteStore.put(o.data);
            if (typedRecords[id].schemaId == 0) {
                if (recordIds.length >= 4096) revert Bounds();
                typedRecords[id] = TypedRecord(o.schemaId, contentId);
                recordIds.push(id);
            }
        }
        // This deliberately follows storage effects: tests verify a late failure
        // rolls semantic state and the separate byte store back together.
        if (receiptCount >= 4096 || block.number > type(uint64).max || block.timestamp > type(uint64).max) revert Bounds();
        if (o.grantId == 0) {
            ++ownerNonce;
        } else {
            GrantState storage g = grants[o.grantId];
            ++g.writes;
            g.payloadBytes += uint64(o.data.length);
        }
        receipts[receiptCount] =
            Receipt(
            abi.encode(o), witness, mode, signer, id, revision, uint64(block.number), uint64(block.timestamp), d
        );
        emit Applied(receiptCount, id, o.kind, d);
        ++receiptCount;
    }

    function _writeRevision(bytes32 id, bytes calldata data) private returns (uint64 r) {
        uint64 old = nodes[id].revision;
        bytes32 previous;
        if (old != 0) {
            Revision storage p = revisions[id][old];
            previous = keccak256(abi.encode(keccak256("efs-lab/revision/1"), id, old, p.contentId, p.previous));
        }
        r = old + 1;
        revisions[id][r] = Revision(byteStore.put(data), previous);
        nodes[id].revision = r;
    }

    function _name(string calldata name) private pure {
        bytes calldata b = bytes(name);
        if (b.length == 0 || b.length > 64 || keccak256(b) == keccak256(".") || keccak256(b) == keccak256("..")) {
            revert InvalidOperation();
        }
        for (uint256 i; i < b.length; ++i) {
            uint8 c = uint8(b[i]);
            if (!((c >= 65 && c <= 90) || (c >= 97 && c <= 122) || (c >= 48 && c <= 57) || c == 45 || c == 46
                        || c == 95)) revert InvalidOperation();
        }
    }

    function registerGrant(Grant calldata g, bytes calldata approval) external lock returns (bytes32 id) {
        if (
            g.key == address(0) || nodes[g.scope].kind == 0 || g.operations == 0 || g.operations > 7
                || g.expiry < block.timestamp || g.maxWrites == 0 || g.maxWrites > 4096 || g.maxBytes > 67108864
                || usedGrantNonces[g.nonce]
        ) revert Unauthorized();
        id = _typed(
            keccak256(abi.encode(GRANT_TYPE, g.key, g.scope, g.operations, g.expiry, g.maxWrites, g.maxBytes, g.nonce))
        );
        if (_recover(id, approval) != owner) revert Unauthorized();
        usedGrantNonces[g.nonce] = true;
        GrantState storage s = grants[id];
        s.grant = g;
        s.approval = approval;
        s.registeredAtReceipt = receiptCount;
        s.registeredBlock = uint64(block.number);
        s.registeredTimestamp = uint64(block.timestamp);
        emit GrantRegistered(id);
    }

    function revokeGrant(bytes32 id) external onlyOwner lock {
        GrantState storage s = grants[id];
        if (s.grant.key == address(0) || s.revoked) revert Missing();
        s.revoked = true;
        s.revokedAtReceipt = receiptCount;
        s.revokedBlock = uint64(block.number);
        s.revokedTimestamp = uint64(block.timestamp);
        emit GrantRevoked(id);
    }

    function grantInfo(bytes32 id) external view returns (Grant memory, bytes memory, bool, uint32, uint64) {
        GrantState storage s = grants[id];
        if (s.grant.key == address(0)) revert Missing();
        return (s.grant, s.approval, s.revoked, s.writes, s.payloadBytes);
    }

    function grantBasis(bytes32 id) external view returns (uint256, uint256, uint64, uint64, uint64, uint64) {
        GrantState storage s = grants[id];
        if (s.grant.key == address(0)) revert Missing();
        return (
            s.registeredAtReceipt,
            s.revokedAtReceipt,
            s.registeredBlock,
            s.revokedBlock,
            s.registeredTimestamp,
            s.revokedTimestamp
        );
    }

    function registerSchema(bytes calldata descriptor) external onlyOwner lock returns (bytes32 id) {
        if (descriptor.length == 0 || descriptor.length > 264) revert InvalidSchema();
        uint256 cursor;
        uint256 fields;
        while (cursor < descriptor.length) {
            uint8 tag = uint8(descriptor[cursor++]);
            if (tag < 1 || tag > 5 || ++fields > 8) revert InvalidSchema();
            if (tag == 5) {
                if (cursor + 32 > descriptor.length) revert InvalidSchema();
                bytes32 target;
                assembly { target := calldataload(add(descriptor.offset, cursor)) }
                if (schemaBodies[target].length == 0) revert InvalidSchema();
                cursor += 32;
            }
        }
        id = keccak256(abi.encode(keccak256("efs-lab/schema/1"), keccak256(descriptor)));
        if (schemaBodies[id].length == 0) {
            if (schemaIds.length >= 64) revert Bounds();
            schemaBodies[id] = descriptor;
            schemaIds.push(id);
            emit SchemaRegistered(id);
        }
    }

    function _validate(bytes32 schemaId, bytes calldata data) private view {
        bytes memory s = schemaBodies[schemaId];
        if (s.length == 0) revert InvalidSchema();
        uint256 p;
        uint256 q;
        while (p < s.length) {
            uint8 tag = uint8(s[p++]);
            uint256 length = tag == 1 ? 8 : tag == 2 ? 1 : 32;
            if (tag == 4) {
                if (q + 2 > data.length) revert InvalidData();
                length = (uint256(uint8(data[q])) << 8) | uint8(data[q + 1]);
                q += 2;
                if (length > 256 || q + length > data.length) revert InvalidData();
                for (uint256 i; i < length; ++i) {
                    if (uint8(data[q + i]) < 32 || uint8(data[q + i]) > 126) revert InvalidData();
                }
            }
            if (q + length > data.length) revert InvalidData();
            if (tag == 2 && uint8(data[q]) > 1) revert InvalidData();
            if (tag == 5) {
                bytes32 wanted;
                bytes32 recordId;
                assembly {
                    wanted := mload(add(add(s, 32), p))
                    recordId := calldataload(add(data.offset, q))
                }
                if (typedRecords[recordId].schemaId != wanted) revert InvalidData();
                p += 32;
            }
            q += length;
        }
        if (q != data.length) revert InvalidData();
    }

    function getSchema(bytes32 id) external view returns (bytes memory) {
        if (schemaBodies[id].length == 0) revert Missing();
        return schemaBodies[id];
    }

    function getRevision(bytes32 id, uint64 revision) external view returns (Revision memory) {
        if (revision == 0 || revision > nodes[id].revision) revert Missing();
        return revisions[id][revision];
    }

    function getRecord(bytes32 id) external view returns (TypedRecord memory) {
        if (typedRecords[id].schemaId == 0) revert Missing();
        return typedRecords[id];
    }

    function child(bytes32 parent, string calldata name) external view returns (bytes32) {
        if (nodes[parent].kind != 1) revert Missing();
        _name(name);
        return childrenByName[parent][keccak256(bytes(name))];
    }

    function _page(bytes32[] storage source, uint256 cursor, uint32 limit)
        private
        view
        returns (bytes32[] memory ids, uint256 next, uint256 total)
    {
        total = source.length;
        if (limit == 0 || limit > 64 || cursor > total) revert Bounds();
        uint256 count = total - cursor;
        if (count > limit) count = limit;
        ids = new bytes32[](count);
        for (uint256 i; i < count; ++i) {
            ids[i] = source[cursor + i];
        }
        next = cursor + count;
    }

    function list(bytes32 directory, uint256 cursor, uint32 limit)
        external
        view
        returns (bytes32[] memory, uint256, uint256)
    {
        if (nodes[directory].kind != 1) revert Missing();
        return _page(children[directory], cursor, limit);
    }

    function records(uint256 cursor, uint32 limit) external view returns (bytes32[] memory, uint256, uint256) {
        return _page(recordIds, cursor, limit);
    }

    function schemas(uint256 cursor, uint32 limit) external view returns (bytes32[] memory, uint256, uint256) {
        return _page(schemaIds, cursor, limit);
    }

    function receipt(uint256 ordinal) external view returns (Receipt memory) {
        if (ordinal >= receiptCount) revert Missing();
        return receipts[ordinal];
    }
}
