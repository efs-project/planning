// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
// Index-layer lab core (revision 4 of the local files-browser prototype).
// Copied from Reviews/2026-09-09-files-browser-mvp/contracts/src/AuthorityUpgrade.sol
// (UpgradeableFixtureCoreU3) with three changes, each marked LAB:
//   1. `executeAuthorized` admits through IndexedAdmission (the WRITE HOOK wrapped
//      around the PINNED kernel library; see IndexedAdmission.sol for why the
//      kernel library itself cannot be swapped on a populated pair).
//   2. The inherited operator path `executeFixture` is retired for real, so the
//      hooked path is the only admission path of this revision.
//   3. Unknown selectors fall through to the IndexLayerModule by delegatecall
//      (declare / backfill / probe / probeTolerated / page / detach), because
//      the U3 core already sits at 23,016 of the 24,576 EIP-170 bytes.
// Disposable local prototype code; no protocol freeze or production claim.

import {StateKernel} from "C0Core/StateKernel.sol";
import {Preparation} from "C0Core/Preparation.sol";
import {UpgradeStorage} from "Foundation/UpgradeStorage.sol";
import {UpgradeableReadFixtureCoreU2} from "Foundation/UpgradeableReadFixtureCore.sol";
import {IndexedAdmission} from "./IndexedAdmission.sol";

library AuthorityStorage {
    /// @custom:storage-location erc7201:efs.fixture.authority.v3
    struct Authority {
        mapping(bytes32 => address) principalAccount; // one-time claimed signer
        mapping(bytes32 => uint64) principalNonce; // sequential intent nonces
    }

    bytes32 internal constant AUTHORITY_SLOT =
        keccak256(abi.encode(uint256(keccak256("efs.fixture.authority.v3")) - 1)) & ~bytes32(uint256(255));

    function authority() internal pure returns (Authority storage s) {
        bytes32 slot = AUTHORITY_SLOT;
        assembly ("memory-safe") {
            s.slot := slot
        }
    }
}

struct AuthorIntent {
    bytes32 opCommitment;
    bytes32 byteCommitment;
    address executor;
    bytes32 executorCodehash;
    uint64 nonce;
    uint64 deadline;
}

contract UpgradeableFixtureCoreU4 is UpgradeableReadFixtureCoreU2 {
    error ErrPrincipalClaimed(bytes32 principal);
    error ErrUnauthorizedPrincipal(bytes32 principal, address recovered);
    error ErrIntentNonce(bytes32 principal, uint64 expected, uint64 got);
    error ErrIntentExpired(uint64 deadline);
    error ErrExecutorBinding(address expected, address sender);
    error ErrOperatorPathRetired();

    event PrincipalClaimed(bytes32 indexed principal, address account);
    event AuthorizedAdmission(
        bytes32 indexed envelopeId, bytes32 indexed principal, address account, address executor, uint64 batchId
    );

    bytes32 private constant INTENT_TYPEHASH = keccak256(
        "AuthorIntent(bytes32 publicationHash,bytes32 executionSetId,bytes32 opCommitment,bytes32 byteCommitment,address executor,bytes32 executorCodehash,uint64 nonce,uint64 deadline)"
    );

    address public immutable indexModule; // LAB: delegatecall target for the index-layer surface

    constructor(address factory, address helper, bytes32 pointReadHash, bytes32 queryReadHash, address module)
        UpgradeableReadFixtureCoreU2(factory, helper, pointReadHash, queryReadHash)
    {
        require(module.code.length != 0, "index module");
        indexModule = module;
    }

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

    /// LAB 2: the un-hooked operator path is retired at this revision.
    function executeFixture(StateKernel.Publication calldata, uint32, uint64, uint64, bytes calldata)
        external
        pure
        override
        returns (StateKernel.AdmitResult memory)
    {
        revert ErrOperatorPathRetired();
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
                        e.id,
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
        if (intent.executor != address(0)) {
            if (msg.sender != intent.executor || intent.executor.codehash != intent.executorCodehash) {
                revert ErrExecutorBinding(intent.executor, msg.sender);
            }
        } else if (msg.sender != account) {
            revert ErrExecutorBinding(account, msg.sender);
        }
        a.principalNonce[principal] = intent.nonce + 1;
        StateKernel.VerifiedContext memory v = StateKernel.VerifiedContext(
            principal, e.ordinal, uint256(uint160(account)), e.coreCodehash
        );
        // LAB 1: hooked admission around the pinned kernel library.
        r = IndexedAdmission.admit(
            UpgradeStorage.efs(), v, publication, Preparation.Config(preparationHelper, preparationCodehash), e.ordinal
        );
        emit AuthorizedAdmission(r.envelopeId, principal, account, intent.executor, r.acceptingBatchId);
    }

    /// LAB 3: index-layer surface by delegatecall (shares the proxy's storage).
    fallback() external {
        address module = indexModule;
        assembly ("memory-safe") {
            calldatacopy(0, 0, calldatasize())
            let ok := delegatecall(gas(), module, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())
            if iszero(ok) { revert(0, returndatasize()) }
            return(0, returndatasize())
        }
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
        if (uint256(s) > 0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0) return address(0);
        return ecrecover(digest, v, r, s);
    }
}
