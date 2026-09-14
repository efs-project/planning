// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Ledger} from "../src/Ledger.sol";
import {FilesJoinedConsumer} from "./FilesJoinedConsumer.sol";
import {LensReader} from "../src/LensReader.sol";
import {Keys} from "../src/Keys.sol";

/// Disposable third-party app: an operator adopts a specific approved source
/// revision as a new app-authored revision. Approval is an attributed assertion,
/// not global truth. No source-signature or native-portability proof is fabricated.
contract FilesApplication {
    Ledger public immutable ledger;
    FilesJoinedConsumer public immutable reader;
    address public immutable operator;
    address public immutable sourceAuthor;
    address public immutable reviewer;
    bytes32 public immutable sourcePrincipal;
    bytes32 public immutable reviewerPrincipal;
    bytes32 public immutable approvalConcept;
    uint64 public adoptionCount;
    bytes32 public lastRevision;
    bytes32 private immutable readerCodehash;
    bytes32 private constant HEAD = keccak256("efs2/purpose/head/1");
    bytes32 private constant TAG = keccak256("efs2/purpose/tag/1");
    error E_OPERATOR();
    error E_SOURCE();
    error E_APPROVAL();
    error E_PROFILE();
    event Adopted(bytes32 indexed file, bytes32 indexed parent, bytes32 revision, uint64 publication);

    constructor(Ledger ledger_, FilesJoinedConsumer reader_, address operator_, address source_, address reviewer_, bytes32 concept_) {
        if (address(ledger_).code.length == 0 || address(reader_).code.length == 0
            || address(reader_.ledger()) != address(ledger_) || operator_ == address(0)
            || source_ == address(0) || reviewer_ == address(0) || concept_ == bytes32(0)) revert E_PROFILE();
        ledger = ledger_;
        reader = reader_;
        operator = operator_;
        sourceAuthor = source_;
        reviewer = reviewer_;
        // Address constructor is a convenience pin at creation, not a resolver
        // re-run on every adoption and not a claim to infer historical identity.
        sourcePrincipal = ledger_.principalOf(source_);
        reviewerPrincipal = ledger_.principalOf(reviewer_);
        approvalConcept = concept_;
        readerCodehash = address(reader_).codehash;
    }

    function adoptApprovedRevision(bytes32 file, bytes32 expectedSelected, uint32 expectedOwnHeadRevision,
        FilesJoinedConsumer.Basis calldata basis) external returns (bytes32 revision, uint64 publication)
    {
        // Legacy ABI keeps its shell-basis meaning. New callers use the explicitly
        // execution-bound method below; this wrapper does not promise upgrade drift detection.
        if (basis.core != address(ledger).codehash) revert E_PROFILE();
        return _adopt(file,expectedSelected,expectedOwnHeadRevision,
            FilesJoinedConsumer.PrincipalBasis(basis.admission,basis.generation,basis.epoch,ledger.executionSet()));
    }

    function adoptApprovedRevisionGuarded(bytes32 file, bytes32 expectedSelected, uint32 expectedOwnHeadRevision,
        FilesJoinedConsumer.PrincipalBasis calldata basis) external returns (bytes32 revision, uint64 publication)
    {
        return _adopt(file,expectedSelected,expectedOwnHeadRevision,basis);
    }

    function _adopt(bytes32 file, bytes32 expectedSelected, uint32 expectedOwnHeadRevision,
        FilesJoinedConsumer.PrincipalBasis memory basis) private returns (bytes32 revision, uint64 publication)
    {
        if (msg.sender != operator) revert E_OPERATOR();
        if (address(reader).codehash != readerCodehash) revert E_PROFILE();
        bytes32[] memory sources = new bytes32[](1);
        sources[0] = sourcePrincipal;
        FilesJoinedConsumer.FilePoint memory point = reader.readFilePointPrincipals(file, sources, approvalConcept, basis);
        if (point.status != 1 || expectedSelected == bytes32(0)
            || point.revision.recordId != expectedSelected || point.revision.file != file) revert E_SOURCE();
        // Read provenance explicitly: FilePoint intentionally does not return it.
        LensReader lens = reader.lensReader();
        (uint8 state, bytes32 target,,,uint64 at) = lens.resolvePrincipals(sources, HEAD, file, bytes32(0),basis.executionSet);
        if (state != 1 || target != expectedSelected || at == 0 || at > basis.admission) revert E_SOURCE();
        bytes32[] memory reviewers = new bytes32[](1);
        reviewers[0] = reviewerPrincipal;
        bytes32 approvalAuthor;
        (state, target,, approvalAuthor, at) = lens.resolvePrincipals(reviewers, TAG, expectedSelected, approvalConcept,basis.executionSet);
        if (state != 1 || target != file || approvalAuthor != reviewerPrincipal || at == 0 || at > basis.admission)
            revert E_APPROVAL();

        bytes memory body = bytes.concat(abi.encode(expectedSelected, file), point.revision.document);
        bytes32 childType = reader.childType();
        revision = Keys.record(childType, body);
        Ledger.Action[] memory actions = new Ledger.Action[](2);
        bytes[] memory bodies = new bytes[](2);
        actions[0].kind = 1;
        actions[0].typeId = childType;
        actions[0].bodyHashOrRecordId = keccak256(body);
        bodies[0] = body;
        actions[1].kind = 3;
        actions[1].purpose = HEAD;
        actions[1].subject = file;
        actions[1].target = revision;
        actions[1].expectedRevision = expectedOwnHeadRevision;

        // The outer transaction owns both app effects and Ledger effects. All of
        // these writes roll back if policy, CAS or mandatory index maintenance fails.
        ++adoptionCount;
        lastRevision = revision;
        (publication,) = ledger.execute(actions, bodies, ledger.nonces(address(this)));
        emit Adopted(file, expectedSelected, revision, publication);
    }
}
