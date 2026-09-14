// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Ledger} from "./Ledger.sol";
import {Keys} from "./Keys.sol";

/// DISPOSABLE LAB: authentic signed claims, never admission or current authority.
abstract contract SignedClaimArchiveBase {
    enum ProofLevel { NONE, AUTHOR_SIGNATURE_VERIFIED }
    struct BodyInput { uint16 leaf; bytes body; }
    struct ClaimCell {
        Ledger.Intent source;
        bytes32 actionsHash;
        bytes32 r;
        bytes32 s;
        uint64 bodyCoverage;
        uint64 retainedAt;
        address firstImporter;
        uint16 leafCount;
        uint8 v;
        ProofLevel proof;
    }
    struct CachedBody { bool exists; bytes data; }
    struct Posting { bytes32 claimId; uint16 leaf; }

    error E_BOUNDS(uint8 code);
    error E_SIGNATURE();
    error E_SOURCE_UNSUPPORTED();
    error E_UNKNOWN_CLAIM(bytes32 claimId);
    error E_LEAF(uint16 leaf);
    error E_BODY_LEAF(uint16 leaf);
    error E_BODY_MISMATCH(uint16 leaf, bytes32 expected, bytes32 actual);

    /// Representation observation only; not an admission or authority proof.
    event ClaimRetained(bytes32 indexed claimId, address vectorLocation, uint16 leafCount);

    uint256 public constant MAX_ACTIONS = 64;
    uint256 public constant MAX_BODY_INPUTS = 64;
    uint256 public constant MAX_BODY_BYTES_PER_CALL = 8192;
    uint256 public constant MAX_RETAIN_CALLDATA = 37_316;
    uint256 public constant MAX_ATTACH_CALLDATA = 18_468;

    bytes32 private constant INTENT_TYPEHASH = keccak256(
        "PublicationIntent(bytes32 realmId,bytes32 coreCodeCommitment,address author,uint64 nonce,uint64 deadline,bytes32 acceptanceProfile,bytes32 indexObligations,bytes32 actionsHash)"
    );
    bytes32 private immutable DOMAIN_SEPARATOR = keccak256(abi.encode(
        keccak256("EIP712Domain(string name,string version)"),
        keccak256("EFS2-RoadB-Lab"),
        keccak256("1")
    ));
    uint256 private constant SECP256K1_N_HALF =
        0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0;

    mapping(bytes32 => ClaimCell) private _claims;
    mapping(bytes32 => CachedBody) private _bodies;
    mapping(bytes32 => Posting[]) private _recordClaims;

    /// Retains an EOA signature over the entire logical vector, without consulting Ledger.
    /// Deadline and source context remain signed claims, not current admission checks.
    function retainSignedClaim(
        Ledger.Intent calldata source,
        Ledger.Action[] calldata actions,
        bytes calldata signature,
        BodyInput[] calldata bodies
    ) external returns (bytes32 claimId) {
        if (msg.data.length > MAX_RETAIN_CALLDATA) revert E_BOUNDS(4);
        if (actions.length == 0 || actions.length > MAX_ACTIONS) revert E_BOUNDS(1);
        if (signature.length == 0) revert E_SOURCE_UNSUPPORTED();
        if (signature.length != 65) revert E_SIGNATURE();
        _checkBodyBounds(bodies);

        bytes32 actionsHash = keccak256(abi.encode(actions));
        claimId = _intentDigest(source, actionsHash);
        (bytes32 r, bytes32 s, uint8 v) = _verifySignature(claimId, source.author, signature);

        _checkBodyLeaves(bodies, uint16(actions.length));
        Ledger.Action[] memory bodyActions = new Ledger.Action[](bodies.length);
        for (uint256 i; i < bodies.length; ++i) bodyActions[i] = actions[bodies[i].leaf];
        bytes32[] memory recordIds = _validateBodies(bodyActions, bodies);

        ClaimCell storage c = _claims[claimId];
        if (c.proof == ProofLevel.NONE) {
            c.source = source;
            c.actionsHash = actionsHash;
            c.r = r;
            c.s = s;
            c.retainedAt = uint64(block.timestamp);
            c.firstImporter = msg.sender;
            c.leafCount = uint16(actions.length);
            c.v = v;
            c.proof = ProofLevel.AUTHOR_SIGNATURE_VERIFIED;
            _storeVector(claimId, actions);
            for (uint16 i; i < actions.length; ++i) {
                Ledger.Action calldata a = actions[i];
                if (a.kind == 1 || a.kind == 2) {
                    _recordClaims[_recordId(a)].push(Posting(claimId, i));
                }
            }
            emit ClaimRetained(claimId, _vectorLocation(claimId), c.leafCount);
        }
        _attachValidated(c, bodies, recordIds);
    }

    /// Anyone can add a verified missing preimage; only this claim gains coverage.
    function attachBodies(bytes32 claimId, BodyInput[] calldata bodies) external {
        if (msg.data.length > MAX_ATTACH_CALLDATA) revert E_BOUNDS(4);
        _checkBodyBounds(bodies);
        ClaimCell storage c = _knownClaim(claimId);
        _checkBodyLeaves(bodies, c.leafCount);
        Ledger.Action[] memory bodyActions = new Ledger.Action[](bodies.length);
        for (uint256 i; i < bodies.length; ++i) bodyActions[i] = _loadAction(claimId, bodies[i].leaf);
        bytes32[] memory recordIds = _validateBodies(bodyActions, bodies);
        _attachValidated(c, bodies, recordIds);
    }

    function claim(bytes32 claimId) external view returns (
        Ledger.Intent memory source, bytes32 actionsHash, uint16 leafCount,
        bytes32 r, bytes32 s, uint8 v, uint64 bodyCoverage,
        ProofLevel proof, address firstImporter, uint64 retainedAt
    ) {
        ClaimCell storage c = _knownClaim(claimId);
        return (c.source, c.actionsHash, c.leafCount, c.r, c.s, c.v,
            c.bodyCoverage, c.proof, c.firstImporter, c.retainedAt);
    }

    function actionAt(bytes32 claimId, uint16 leaf) external view returns (Ledger.Action memory) {
        ClaimCell storage c = _knownClaim(claimId);
        if (leaf >= c.leafCount) revert E_LEAF(leaf);
        return _loadAction(claimId, leaf);
    }

    function selectedRecord(bytes32 claimId, uint16 leaf) external view returns (
        bytes32 recordId, bytes32 typeId, bool claimBodyAttached, bytes memory body
    ) {
        ClaimCell storage c = _knownClaim(claimId);
        if (leaf >= c.leafCount) revert E_LEAF(leaf);
        Ledger.Action memory a = _loadAction(claimId, leaf);
        if (a.kind != 1 && a.kind != 2) revert E_BODY_LEAF(leaf);
        recordId = _recordId(a);
        typeId = a.typeId;
        claimBodyAttached = (c.bodyCoverage & (uint64(1) << leaf)) != 0;
        if (claimBodyAttached) body = _bodies[recordId].data;
    }

    /// Counts signed leaf occurrences, not accepted Records or live destination assertions.
    function signedRecordClaimCount(bytes32 claimedRecordId) external view returns (uint64) {
        return uint64(_recordClaims[claimedRecordId].length);
    }

    function signedRecordClaimAt(bytes32 claimedRecordId, uint64 ordinal)
        external view returns (bytes32 claimId, uint16 leaf) {
        Posting storage p = _recordClaims[claimedRecordId][ordinal];
        return (p.claimId, p.leaf);
    }

    function _knownClaim(bytes32 claimId) private view returns (ClaimCell storage c) {
        c = _claims[claimId];
        if (c.proof != ProofLevel.AUTHOR_SIGNATURE_VERIFIED) revert E_UNKNOWN_CLAIM(claimId);
    }

    function _intentDigest(Ledger.Intent memory x, bytes32 actionsHash) private view returns (bytes32) {
        bytes32 sh = keccak256(abi.encode(INTENT_TYPEHASH, x.realmId, x.coreCodeCommitment,
            x.author, x.nonce, x.deadline, x.acceptanceProfile, x.indexObligations, actionsHash));
        return keccak256(abi.encodePacked(hex"1901", DOMAIN_SEPARATOR, sh));
    }

    function _verifySignature(bytes32 digest, address author, bytes calldata signature)
        private pure returns (bytes32 r, bytes32 s, uint8 v) {
        assembly ("memory-safe") {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 32))
            v := byte(0, calldataload(add(signature.offset, 64)))
        }
        if (uint256(s) > SECP256K1_N_HALF || (v != 27 && v != 28)) revert E_SIGNATURE();
        address recovered = ecrecover(digest, v, r, s);
        if (recovered == address(0) || recovered != author) revert E_SIGNATURE();
    }

    // These loops only inspect descriptors and lengths; body bytes have not been copied or hashed.
    function _checkBodyBounds(BodyInput[] calldata bodies) private pure {
        if (bodies.length > MAX_BODY_INPUTS) revert E_BOUNDS(2);
        uint256 total;
        for (uint256 i; i < bodies.length; ++i) {
            total += bodies[i].body.length;
            if (total > MAX_BODY_BYTES_PER_CALL) revert E_BOUNDS(3);
        }
    }

    function _checkBodyLeaves(BodyInput[] calldata bodies, uint16 leafCount) private pure {
        uint64 seen;
        for (uint256 i; i < bodies.length; ++i) {
            uint16 leaf = bodies[i].leaf;
            if (leaf >= leafCount) revert E_LEAF(leaf);
            uint64 bit = uint64(1) << leaf;
            if ((seen & bit) != 0) revert E_BODY_LEAF(leaf);
            seen |= bit;
        }
    }

    function _validateBodies(Ledger.Action[] memory bodyActions, BodyInput[] calldata bodies)
        private pure returns (bytes32[] memory recordIds) {
        // Validate every kind before touching even the first body's bytes.
        for (uint256 i; i < bodies.length; ++i) {
            uint8 kind = bodyActions[i].kind;
            if (kind != 1 && kind != 2) revert E_BODY_LEAF(bodies[i].leaf);
        }
        recordIds = new bytes32[](bodies.length);
        for (uint256 i; i < bodies.length; ++i) {
            bytes32 expected = _recordId(bodyActions[i]);
            bytes32 actual = Keys.record(bodyActions[i].typeId, bodies[i].body);
            if (actual != expected) revert E_BODY_MISMATCH(bodies[i].leaf, expected, actual);
            recordIds[i] = expected;
        }
    }

    function _recordId(Ledger.Action memory a) private pure returns (bytes32) {
        return a.kind == 1 ? Keys.recordFromHash(a.typeId, a.bodyHashOrRecordId) : a.bodyHashOrRecordId;
    }

    // All descriptors and hashes passed first. Never overwrite a cached body or a covered claim.
    function _attachValidated(ClaimCell storage c, BodyInput[] calldata bodies, bytes32[] memory recordIds) private {
        uint64 coverage = c.bodyCoverage;
        for (uint256 i; i < bodies.length; ++i) {
            CachedBody storage cached = _bodies[recordIds[i]];
            if (!cached.exists) {
                cached.exists = true;
                cached.data = bodies[i].body;
            }
            coverage |= uint64(1) << bodies[i].leaf;
        }
        if (coverage != c.bodyCoverage) c.bodyCoverage = coverage;
    }

    function _storeVector(bytes32 claimId, Ledger.Action[] calldata actions) internal virtual;
    function _loadAction(bytes32 claimId, uint16 leaf) internal view virtual returns (Ledger.Action memory);
    function _vectorLocation(bytes32) internal view virtual returns (address) { return address(0); }
}

contract SignedClaimArchivePacked is SignedClaimArchiveBase {
    struct PackedAction {
        uint256 meta; // kind uint8 @ bit 0; expectedRevision uint32 @ bit 8
        bytes32 typeId;
        bytes32 bodyHashOrRecordId;
        bytes32 purpose;
        bytes32 subject;
        bytes32 role;
        bytes32 target;
        bytes32 salt;
    }

    mapping(bytes32 => PackedAction[]) private _vectors;

    function _storeVector(bytes32 claimId, Ledger.Action[] calldata actions) internal override {
        for (uint256 i; i < actions.length; ++i) {
            Ledger.Action calldata a = actions[i];
            _vectors[claimId].push(PackedAction(
                uint256(a.kind) | (uint256(a.expectedRevision) << 8), a.typeId, a.bodyHashOrRecordId,
                a.purpose, a.subject, a.role, a.target, a.salt
            ));
        }
    }

    function _loadAction(bytes32 claimId, uint16 leaf) internal view override returns (Ledger.Action memory) {
        PackedAction storage a = _vectors[claimId][leaf];
        return Ledger.Action(uint8(a.meta), a.typeId, a.bodyHashOrRecordId, a.purpose,
            a.subject, a.role, a.target, uint32(a.meta >> 8), a.salt);
    }
}

/// Private data carrier: runtime is a STOP byte followed by the immutable ABI vector.
contract ActionCodeBlob {
    constructor(bytes memory encodedActions) {
        bytes memory runtime = bytes.concat(hex"00", encodedActions);
        assembly ("memory-safe") { return(add(runtime, 32), mload(runtime)) }
    }
}

contract SignedClaimArchiveCodeBlob is SignedClaimArchiveBase {
    mapping(bytes32 => address) private _vector;

    function _storeVector(bytes32 claimId, Ledger.Action[] calldata actions) internal override {
        _vector[claimId] = address(new ActionCodeBlob(abi.encode(actions)));
    }

    function _loadAction(bytes32 claimId, uint16 leaf) internal view override returns (Ledger.Action memory x) {
        bytes memory raw = new bytes(288);
        address blob = _vector[claimId];
        assembly ("memory-safe") { extcodecopy(blob, add(raw, 32), add(65, mul(leaf, 288)), 288) }
        x = abi.decode(raw, (Ledger.Action));
    }

    function _vectorLocation(bytes32 claimId) internal view override returns (address) {
        return _vector[claimId];
    }
}

contract SignedClaimArchive is SignedClaimArchivePacked {}
