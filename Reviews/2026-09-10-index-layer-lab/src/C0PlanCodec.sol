// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {StateKernel} from "./StateKernel.sol";

library C0PlanCodec {
    error InvalidPublicationHeader();
    error InvalidRecordCount(uint256 count);
    error InvalidExpectedRevisions();

    bytes32 private constant WRITE_DOMAIN_TYPEHASH =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    bytes32 private constant WRITE_DOMAIN_NAME_HASH = keccak256("EFS2-MVP-C0-WritePlan");
    bytes32 private constant VERSION_HASH = keccak256("1");
    bytes32 private constant WRITE_PLAN_TYPEHASH = keccak256(
        "WritePlan(bytes32 c0ProfileId,bytes32 publicationDigest,bytes32 realmId,bytes32 realmEffectsDigest,address executor,bytes32 executorCodeHash,uint192 nonceKey,uint64 nonceSeq,uint64 notAfter)"
    );
    bytes32 private constant ENVELOPE_DOMAIN_SEPARATOR = keccak256(
        abi.encode(keccak256("EIP712Domain(string name,string version)"), keccak256("EFS2-Envelope"), keccak256("1"))
    );
    bytes32 private constant ENVELOPE_TYPEHASH = keccak256(
        "PublicationEnvelope(uint16 profile,bytes32 principalId,bytes32 authorityRef,uint64 authEpoch,bytes32 pubNonce,uint64 notAfter,bytes32[] recordIds)"
    );
    bytes32 private constant EXPECTED_REVISION_TYPEHASH =
        keccak256("ExpectedRevision(uint16 leafIndex,uint32 revision)");
    bytes32 private constant REALM_EFFECTS_TYPEHASH = keccak256(
        "C0RealmEffects(bytes32 realmId,address core,bytes32 routeConfigId,bytes32 genesisReceiptHash,uint8 operationKind,bytes32 envelopeId,uint64 leafMask,bytes32 expectedRevisionsHash,address stateByteStore,bytes32 byteCommitment)"
    );

    struct Plan {
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

    struct Effects {
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

    function publicationDigest(StateKernel.EnvelopeHeader memory header, bytes32[] memory recordIds)
        internal
        pure
        returns (bytes32)
    {
        if (header.profile != 1 || header.authorityRef != bytes32(0) || header.authEpoch != 0) {
            revert InvalidPublicationHeader();
        }
        uint256 count = recordIds.length;
        if (count == 0 || count > 64) revert InvalidRecordCount(count);
        bytes32 structHash = keccak256(
            abi.encode(
                ENVELOPE_TYPEHASH,
                header.profile,
                header.principalId,
                header.authorityRef,
                header.authEpoch,
                header.pubNonce,
                header.notAfter,
                keccak256(abi.encodePacked(recordIds))
            )
        );
        return keccak256(abi.encodePacked(hex"1901", ENVELOPE_DOMAIN_SEPARATOR, structHash));
    }

    function expectedRevisionsHash(StateKernel.ExpectedRevision[] memory rows) internal pure returns (bytes32) {
        uint256 count = rows.length;
        if (count > 64) revert InvalidExpectedRevisions();
        for (uint256 i; i < count; ++i) {
            if (rows[i].leafIndex >= 64 || (i != 0 && rows[i - 1].leafIndex >= rows[i].leafIndex)) {
                revert InvalidExpectedRevisions();
            }
        }
        bytes memory rowHashes;
        for (uint256 i; i < count; ++i) {
            bytes32 rowHash = keccak256(abi.encode(EXPECTED_REVISION_TYPEHASH, rows[i].leafIndex, rows[i].revision));
            rowHashes = bytes.concat(rowHashes, abi.encodePacked(rowHash));
        }
        return keccak256(rowHashes);
    }

    function effectsHash(Effects memory effects) internal pure returns (bytes32) {
        return keccak256(
            abi.encode(
                REALM_EFFECTS_TYPEHASH,
                effects.realmId,
                effects.core,
                effects.routeConfigId,
                effects.genesisReceiptHash,
                effects.operationKind,
                effects.envelopeId,
                effects.leafMask,
                effects.expectedRevisionsHash,
                effects.stateByteStore,
                effects.byteCommitment
            )
        );
    }

    function domainSeparator(uint256 chainId, address core) internal pure returns (bytes32) {
        return keccak256(abi.encode(WRITE_DOMAIN_TYPEHASH, WRITE_DOMAIN_NAME_HASH, VERSION_HASH, chainId, core));
    }

    function planStructHash(Plan memory plan) internal pure returns (bytes32) {
        return keccak256(
            abi.encode(
                WRITE_PLAN_TYPEHASH,
                plan.c0ProfileId,
                plan.publicationDigest,
                plan.realmId,
                plan.realmEffectsDigest,
                plan.executor,
                plan.executorCodeHash,
                plan.nonceKey,
                plan.nonceSeq,
                plan.notAfter
            )
        );
    }

    function planDigest(Plan memory plan, uint256 chainId, address core) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(hex"1901", domainSeparator(chainId, core), planStructHash(plan)));
    }

    function encodePlan(Plan memory plan) internal pure returns (bytes memory) {
        return abi.encodePacked(
            plan.c0ProfileId,
            plan.publicationDigest,
            plan.realmId,
            plan.realmEffectsDigest,
            plan.executor,
            plan.executorCodeHash,
            plan.nonceKey,
            plan.nonceSeq,
            plan.notAfter
        );
    }

    function encodeEffects(Effects memory effects) internal pure returns (bytes memory) {
        return abi.encodePacked(
            effects.realmId,
            effects.core,
            effects.routeConfigId,
            effects.genesisReceiptHash,
            effects.operationKind,
            effects.envelopeId,
            effects.leafMask,
            effects.expectedRevisionsHash,
            effects.stateByteStore,
            effects.byteCommitment
        );
    }
}
