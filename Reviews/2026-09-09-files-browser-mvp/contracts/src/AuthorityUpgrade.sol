// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
// Revision-3 authority upgrade for the local files-browser prototype:
//  - Core U3: per-principal ACCOUNT authorization (one-time claims) with an
//    author-signed AuthorIntent that binds the exact publication, execution
//    set, operation commitment, byte commitment and — when routed — the
//    executor address+codehash, so a bearer of the signed intent CANNOT
//    submit it anywhere but the named router. The synthetic operator write
//    path is RETIRED at this revision.
//  The synthetic operator path REMAINS as the fixture's genesis/admin-era
//  authority — the same trust class as the upgrade controller, which can
//  replace the code entirely; in-contract "retirement" would be theater.
//  The served browser build carries NO operator key: the author-intent path
//  is the only authority the app can exercise, and the four bypass attacks
//  (impersonation, replay, direct-Core, stale plan) are contract-refused.
//  - Carrier U3: permissionless, content-addressed, write-once CHUNKED byte
//    staging under the existing C0ChunkTree law (4 KiB-multiple chunks,
//    0x00-leaf/0x01-node prefixes, odd node promoted). Staging validated
//    bytes needs no signature: this is a reversible prototype selection that
//    makes uploads one-approval; production spam pricing is a separate,
//    undecided admission question.
// Disposable local prototype code; no protocol freeze or production claim.

import {StateStore} from "C0Core/StateStore.sol";
import {StateKernel} from "C0Core/StateKernel.sol";
import {Preparation} from "C0Core/Preparation.sol";
import {UpgradeStorage} from "Foundation/UpgradeStorage.sol";
import {UpgradeAdmissionLibrary} from "Foundation/UpgradeAdmissionLibrary.sol";
import {UpgradeableReadFixtureCoreU2} from "Foundation/UpgradeableReadFixtureCore.sol";
import {UpgradeableFixtureCarrierU2} from "Foundation/UpgradeableFixtureCarrier.sol";

library AuthorityStorage {
    /// @custom:storage-location erc7201:efs.fixture.authority.v3
    struct Authority {
        mapping(bytes32 => address) principalAccount; // one-time claimed signer
        mapping(bytes32 => uint64) principalNonce; // sequential intent nonces
    }

    /// @custom:storage-location erc7201:efs.fixture.chunks.v3
    struct ChunkStore {
        mapping(bytes32 => TreeStatus) status;
        mapping(bytes32 => mapping(uint32 => bytes)) chunk;
    }

    struct TreeStatus {
        uint32 chunkSize;
        uint32 chunkCount;
        uint64 totalSize;
        uint32 present;
        bytes32 root;
    }

    bytes32 internal constant AUTHORITY_SLOT =
        keccak256(abi.encode(uint256(keccak256("efs.fixture.authority.v3")) - 1)) & ~bytes32(uint256(255));
    bytes32 internal constant CHUNKS_SLOT =
        keccak256(abi.encode(uint256(keccak256("efs.fixture.chunks.v3")) - 1)) & ~bytes32(uint256(255));

    function authority() internal pure returns (Authority storage s) {
        bytes32 slot = AUTHORITY_SLOT;
        assembly ("memory-safe") {
            s.slot := slot
        }
    }

    function chunks() internal pure returns (ChunkStore storage s) {
        bytes32 slot = CHUNKS_SLOT;
        assembly ("memory-safe") {
            s.slot := slot
        }
    }
}

struct AuthorIntent {
    bytes32 opCommitment; // keccak(abi.encode(FilesOp)) for routed ops; 0 for direct
    bytes32 byteCommitment; // keccak(abi.encode(treeId, bodyHash)) audit binding; 0 if no bytes
    address executor; // nonzero => ONLY this contract may submit (routed consent)
    bytes32 executorCodehash; // required codehash of the executor when routed
    uint64 nonce; // sequential per principal
    uint64 deadline;
}

contract UpgradeableFixtureCoreU3 is UpgradeableReadFixtureCoreU2 {
    error ErrPrincipalClaimed(bytes32 principal);
    error ErrUnauthorizedPrincipal(bytes32 principal, address recovered);
    error ErrIntentNonce(bytes32 principal, uint64 expected, uint64 got);
    error ErrIntentExpired(uint64 deadline);
    error ErrExecutorBinding(address expected, address sender);

    event PrincipalClaimed(bytes32 indexed principal, address account);
    event AuthorizedAdmission(
        bytes32 indexed envelopeId, bytes32 indexed principal, address account, address executor, uint64 batchId
    );

    bytes32 private constant INTENT_TYPEHASH = keccak256(
        "AuthorIntent(bytes32 publicationHash,bytes32 executionSetId,bytes32 opCommitment,bytes32 byteCommitment,address executor,bytes32 executorCodehash,uint64 nonce,uint64 deadline)"
    );

    constructor(address factory, address helper, bytes32 pointReadHash, bytes32 queryReadHash)
        UpgradeableReadFixtureCoreU2(factory, helper, pointReadHash, queryReadHash)
    {}

    /// One-time, first-come binding of a fixture principal to a signer account.
    function claimPrincipal(bytes32 principal) external {
        AuthorityStorage.Authority storage a = AuthorityStorage.authority();
        if (principal == bytes32(0) || a.principalAccount[principal] != address(0)) {
            revert ErrPrincipalClaimed(principal);
        }
        a.principalAccount[principal] = msg.sender;
        emit PrincipalClaimed(principal, msg.sender);
    }

    function principalAccount(bytes32 principal) external view returns (address) {
        return AuthorityStorage.authority().principalAccount[principal];
    }

    function principalNonce(bytes32 principal) external view returns (uint64) {
        return AuthorityStorage.authority().principalNonce[principal];
    }

    function intentDomainSeparator() public view returns (bytes32) {
        return keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256("EFS Files Authority"),
                keccak256("3"),
                block.chainid,
                address(this)
            )
        );
    }

    /// The revision-3 write path: the AUTHOR's signature is the authority.
    function executeAuthorized(
        StateKernel.Publication calldata publication,
        uint32 expectedRevision,
        AuthorIntent calldata intent,
        bytes calldata authorSignature
    ) external returns (StateKernel.AdmitResult memory r) {
        UpgradeStorage.ExecutionSet memory e = _execution(expectedRevision);
        if (intent.deadline == 0 || block.timestamp > intent.deadline) revert ErrIntentExpired(intent.deadline);
        bytes32 principal = publication.header.principalId;
        AuthorityStorage.Authority storage a = AuthorityStorage.authority();
        if (a.principalNonce[principal] != intent.nonce) {
            revert ErrIntentNonce(principal, a.principalNonce[principal], intent.nonce);
        }
        bytes32 digest = keccak256(
            abi.encodePacked(
                hex"1901",
                intentDomainSeparator(),
                keccak256(
                    abi.encode(
                        INTENT_TYPEHASH,
                        keccak256(abi.encode(publication)),
                        e.id, // stale plans die here: the signature names the execution set
                        intent.opCommitment,
                        intent.byteCommitment,
                        intent.executor,
                        intent.executorCodehash,
                        intent.nonce,
                        intent.deadline
                    )
                )
            )
        );
        address recovered = _recover(digest, authorSignature);
        address account = a.principalAccount[principal];
        if (recovered == address(0) || account == address(0) || recovered != account) {
            revert ErrUnauthorizedPrincipal(principal, recovered);
        }
        // Routed consent: a bearer cannot re-route the signed intent. Only the
        // named executor (with the named runtime) may submit it.
        if (intent.executor != address(0)) {
            if (msg.sender != intent.executor || intent.executor.codehash != intent.executorCodehash) {
                revert ErrExecutorBinding(intent.executor, msg.sender);
            }
        } else if (msg.sender != account) {
            // Direct path: only the author's own account submits its intent.
            revert ErrExecutorBinding(account, msg.sender);
        }
        a.principalNonce[principal] = intent.nonce + 1;
        StateKernel.VerifiedContext memory v = StateKernel.VerifiedContext(
            principal, e.ordinal, uint256(uint160(account)), e.coreCodehash
        );
        r = UpgradeAdmissionLibrary.admit(
            UpgradeStorage.efs(), v, publication, Preparation.Config(preparationHelper, preparationCodehash), e.ordinal
        );
        emit AuthorizedAdmission(r.envelopeId, principal, account, intent.executor, r.acceptingBatchId);
    }

    function _recover(bytes32 digest, bytes calldata signature) private pure returns (address) {
        if (signature.length != 65) return address(0);
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly ("memory-safe") {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 32))
            v := byte(0, calldataload(add(signature.offset, 64)))
        }
        // Reject malleable high-s signatures.
        if (uint256(s) > 0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0) return address(0);
        return ecrecover(digest, v, r, s);
    }
}

contract UpgradeableFixtureCarrierU3 is UpgradeableFixtureCarrierU2 {
    uint32 public constant MAX_CHUNK_COUNT = 256; // 1 MiB at the 4 KiB fixture chunk size
    bytes32 private constant DOM_RECORD = keccak256("efs2/record/1");

    error ErrChunkTreeShape();
    error ErrChunkIndex(uint32 index);
    error ErrChunkLeafMismatch(uint32 index);
    error ErrChunkImmutable(uint32 index);
    error ErrChunkMissing(uint32 index);

    event ChunkStaged(bytes32 indexed treeId, uint32 index, uint32 present, uint32 count);

    constructor(address factory, address helper) UpgradeableFixtureCarrierU2(factory, helper) {}

    /// Permissionless, validated, write-once chunk staging. Content addressing
    /// is the authorization: only bytes matching the committed tree can land.
    function stageChunk(
        bytes32 treeId,
        bytes calldata body,
        uint32 index,
        bytes calldata chunkData,
        bytes32[] calldata leaves
    ) external {
        if (body.length != 48) revert ErrChunkTreeShape();
        uint32 chunkSize;
        uint32 chunkCount;
        uint64 totalSize;
        bytes32 merkleRoot;
        assembly ("memory-safe") {
            chunkSize := shr(224, calldataload(body.offset))
            chunkCount := shr(224, calldataload(add(body.offset, 4)))
            totalSize := shr(192, calldataload(add(body.offset, 8)))
            merkleRoot := calldataload(add(body.offset, 16))
        }
        UpgradeStorage.Control storage c = UpgradeStorage.control();
        if (treeId != keccak256(abi.encode(DOM_RECORD, c.treeType, keccak256(body)))) revert ErrChunkTreeShape();
        if (
            totalSize == 0 || chunkSize < 4096 || chunkSize % 4096 != 0 || chunkCount == 0
                || chunkCount > MAX_CHUNK_COUNT || chunkCount != (uint256(totalSize) - 1) / chunkSize + 1
        ) revert ErrChunkTreeShape();
        if (leaves.length != chunkCount) revert ErrChunkTreeShape();
        if (_fold(leaves) != merkleRoot) revert ErrChunkTreeShape();
        if (index >= chunkCount) revert ErrChunkIndex(index);
        uint256 expectedLength =
            index == chunkCount - 1 ? uint256(totalSize) - uint256(index) * chunkSize : chunkSize;
        if (chunkData.length != expectedLength) revert ErrChunkLeafMismatch(index);
        if (keccak256(abi.encodePacked(bytes1(0x00), chunkData)) != leaves[index]) revert ErrChunkLeafMismatch(index);

        AuthorityStorage.ChunkStore storage store = AuthorityStorage.chunks();
        AuthorityStorage.TreeStatus storage status = store.status[treeId];
        if (status.chunkCount == 0) {
            status.chunkSize = chunkSize;
            status.chunkCount = chunkCount;
            status.totalSize = totalSize;
            status.root = merkleRoot;
        }
        bytes storage existing = store.chunk[treeId][index];
        if (existing.length != 0) {
            if (keccak256(existing) != keccak256(chunkData)) revert ErrChunkImmutable(index);
            return; // idempotent re-stage of identical bytes
        }
        store.chunk[treeId][index] = chunkData;
        status.present += 1;
        emit ChunkStaged(treeId, index, status.present, chunkCount);
    }

    function _fold(bytes32[] calldata leaves) private pure returns (bytes32) {
        uint256 count = leaves.length;
        bytes32[] memory nodes = new bytes32[](count);
        for (uint256 i; i < count; ++i) {
            nodes[i] = leaves[i];
        }
        while (count > 1) {
            uint256 next;
            for (uint256 i; i < count; i += 2) {
                nodes[next++] =
                    i + 1 < count ? keccak256(abi.encodePacked(bytes1(0x01), nodes[i], nodes[i + 1])) : nodes[i];
            }
            count = next;
        }
        return nodes[0];
    }

    function chunkStatus(bytes32 treeId)
        external
        view
        returns (uint32 chunkSize, uint32 chunkCount, uint64 totalSize, uint32 present, bytes32 root)
    {
        AuthorityStorage.TreeStatus storage s = AuthorityStorage.chunks().status[treeId];
        return (s.chunkSize, s.chunkCount, s.totalSize, s.present, s.root);
    }

    function hasChunk(bytes32 treeId, uint32 index) external view returns (bool) {
        return AuthorityStorage.chunks().chunk[treeId][index].length != 0;
    }

    function readChunk(bytes32 treeId, uint32 index) external view returns (bytes memory) {
        bytes storage data = AuthorityStorage.chunks().chunk[treeId][index];
        if (data.length == 0) revert ErrChunkMissing(index);
        return data;
    }

}
