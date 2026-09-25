// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Ledger} from "../src/Ledger.sol";
import {Keys} from "../src/Keys.sol";

/// Disposable Prague fixture. Its storage is the delegating EOA's storage, not
/// the implementation contract's. It does not provide an arbitrary-call path.
contract Scoped7702Delegate {
    struct Grant {
        bytes32 file;
        uint64 epoch;
        uint64 nonce;
        uint64 validUntil;
        bool active;
        uint32 remaining;
    }

    bytes32 private constant DOMAIN_TYPEHASH =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    bytes32 private constant SESSION_TYPEHASH = keccak256(
        "SessionEdit(address child,bytes32 file,address ledger,bytes32 executionSet,uint64 grantEpoch,uint64 childNonce,uint64 ledgerNonce,bytes32 actionsHash,bytes32 readSetHash,uint64 deadline)"
    );
    uint256 private constant HALF_ORDER =
        0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0;

    Ledger public immutable ledger;
    bytes32 public immutable childType;
    bytes32 public immutable headPurpose;
    mapping(address => Grant) public grants;

    error E_OWNER();
    error E_GRANT();
    error E_SCOPE();
    error E_NONCE();
    error E_SIGNATURE();

    constructor(Ledger ledger_, bytes32 childType_, bytes32 headPurpose_) {
        if (address(ledger_).code.length == 0 || childType_ == 0 || headPurpose_ == 0) revert E_SCOPE();
        ledger = ledger_;
        childType = childType_;
        headPurpose = headPurpose_;
    }

    function grantPair(address a, address b, bytes32 file, uint64 validUntil, uint32 maxEdits) external {
        _self();
        if (a == address(0) || b == address(0) || a == b || file == 0 || validUntil <= block.timestamp
            || maxEdits == 0 || ledger.subjectCreatedAt(file) == 0) revert E_GRANT();
        _head(file);
        _grant(a, file, validUntil, maxEdits);
        _grant(b, file, validUntil, maxEdits);
    }

    function revoke(address child) external {
        _self();
        Grant storage g = grants[child];
        if (!g.active) revert E_GRANT();
        g.active = false;
        ++g.epoch;
    }

    function sessionDigest(address child, bytes32 actionsHash, bytes32 readSetHash, uint64 ledgerNonce,
        bytes32 executionSet, uint64 childNonce, uint64 deadline) external view returns (bytes32) {
        return _digest(child, actionsHash, readSetHash, ledgerNonce, executionSet, childNonce, deadline);
    }

    function run(Ledger target, Ledger.Action[] calldata actions, bytes[] calldata bodies, uint64 ledgerNonce,
        bytes32 executionSet, Ledger.ReadSetV2 calldata reads, address child, uint64 childNonce,
        uint64 deadline, bytes calldata signature) external returns (uint64 publication, uint64 firstAdmission) {
        if (address(target) != address(ledger)) revert E_SCOPE();
        Grant storage g = grants[child];
        if (!g.active || g.file == 0 || g.remaining == 0 || block.timestamp > g.validUntil
            || block.timestamp > deadline) revert E_GRANT();
        if (childNonce != g.nonce || ledgerNonce != ledger.nonces(address(this))) revert E_NONCE();
        if (executionSet != ledger.executionSet()) revert E_SCOPE();
        _scope(actions, bodies, g.file);
        bytes32 digest = _digest(child, keccak256(abi.encode(actions)), ledger.readSetHash(reads),
            ledgerNonce, executionSet, childNonce, deadline);
        if (_recover(digest, signature) != child) revert E_SIGNATURE();
        ++g.nonce;
        --g.remaining;
        return ledger.executeGuarded(actions, bodies, ledgerNonce, executionSet, reads);
    }

    function _grant(address child, bytes32 file, uint64 validUntil, uint32 maxEdits) private {
        Grant storage g = grants[child];
        ++g.epoch;
        g.file = file;
        g.nonce = 0;
        g.validUntil = validUntil;
        g.active = true;
        g.remaining = maxEdits;
    }

    function _self() private view {
        if (msg.sender != address(this)) revert E_OWNER();
        if (ledger.principalOf(address(this)) != Keys.principal(address(this))) revert E_OWNER();
    }

    function _head(bytes32 file) private view returns (uint32 revision, bytes32 current) {
        bytes32 key = Keys.binding(Keys.principal(address(this)), Keys.position(headPurpose, file, bytes32(0)));
        uint8 state;
        (state, revision, , , , current) = ledger.head(key);
        if (state != 1 || current == 0) revert E_SCOPE();
    }

    function _scope(Ledger.Action[] calldata actions, bytes[] calldata bodies, bytes32 file) private view {
        if (actions.length != 2 || bodies.length != 2 || bodies[1].length != 0 || bodies[0].length < 64) revert E_SCOPE();
        Ledger.Action calldata publish = actions[0];
        Ledger.Action calldata bind = actions[1];
        if (publish.kind != 1 || publish.typeId != childType || publish.bodyHashOrRecordId != keccak256(bodies[0])
            || publish.purpose != 0 || publish.subject != 0 || publish.role != 0 || publish.target != 0
            || publish.expectedRevision != 0 || publish.salt != 0) revert E_SCOPE();
        bytes calldata body = bodies[0];
        bytes32 parent;
        bytes32 bodyFile;
        assembly ("memory-safe") {
            parent := calldataload(body.offset)
            bodyFile := calldataload(add(body.offset, 32))
        }
        if (bodyFile != file || parent == 0) revert E_SCOPE();
        if (bind.kind != 3 || bind.typeId != 0 || bind.bodyHashOrRecordId != 0 || bind.purpose != headPurpose
            || bind.subject != file || bind.role != 0 || bind.target != Keys.recordFromHash(childType, publish.bodyHashOrRecordId)
            || bind.salt != 0) revert E_SCOPE();
        (uint32 revision, bytes32 current) = _head(file);
        if (current != parent || bind.expectedRevision != revision) revert E_SCOPE();
    }

    function _digest(address child, bytes32 actionsHash, bytes32 readSetHash, uint64 ledgerNonce,
        bytes32 executionSet, uint64 childNonce, uint64 deadline) private view returns (bytes32) {
        Grant storage g = grants[child];
        bytes32 domain = keccak256(abi.encode(DOMAIN_TYPEHASH, keccak256("EFS Scoped 7702 Lab"),
            keccak256("1"), block.chainid, address(this)));
        bytes32 request = keccak256(abi.encode(SESSION_TYPEHASH, child, g.file, address(ledger), executionSet,
            g.epoch, childNonce, ledgerNonce, actionsHash, readSetHash, deadline));
        return keccak256(abi.encodePacked("\x19\x01", domain, request));
    }

    function _recover(bytes32 digest, bytes calldata signature) private pure returns (address signer) {
        if (signature.length != 65) revert E_SIGNATURE();
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly ("memory-safe") {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 32))
            v := byte(0, calldataload(add(signature.offset, 64)))
        }
        if (v != 27 && v != 28 || uint256(s) > HALF_ORDER || s == 0) revert E_SIGNATURE();
        signer = ecrecover(digest, v, r, s);
        if (signer == address(0)) revert E_SIGNATURE();
    }
}
