// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import {StateStore} from "C0Core/StateStore.sol";
import {StateKernel} from "C0Core/StateKernel.sol";
import {Preparation} from "C0Core/Preparation.sol";
import {UpgradeStorage, FixtureEndpoint} from "./UpgradeStorage.sol";
import {UpgradeAdmissionLibrary} from "./UpgradeAdmissionLibrary.sol";

/// @notice Operator-signed synthetic-author adapter, NOT full C0 authority.
contract UpgradeableFixtureCore is FixtureEndpoint {
    event FixtureAdmissionResult(
        bytes32 indexed envelopeId, uint64 envelopeOrdinal, uint64 acceptingBatchId, StateKernel.LeafResult[] leaves
    );
    constructor(address factory, address helper) FixtureEndpoint(factory, helper) {}

    function initialize(
        address controller,
        address peer,
        address admin,
        address operator,
        bytes32 treeType,
        StateKernel.Init calldata init
    ) external {
        _initialize(controller, peer, admin, operator, treeType);
        StateKernel.initialize(UpgradeStorage.efs(), init, Preparation.Config(preparationHelper, preparationCodehash));
    }

    function executeFixture(
        StateKernel.Publication calldata publication,
        uint32 expectedRevision,
        uint64 nonce,
        uint64 deadline,
        bytes calldata signature
    ) external returns (StateKernel.AdmitResult memory r) {
        UpgradeStorage.ExecutionSet memory e = _execution(expectedRevision);
        _authorize(
            keccak256(
                abi.encode(
                    keccak256(
                        "FixturePlan(bytes32 publicationHash,bytes32 executionSetId,uint64 nonce,uint64 deadline)"
                    ),
                    keccak256(abi.encode(publication)),
                    e.id,
                    nonce,
                    deadline
                )
            ),
            nonce,
            deadline,
            signature
        );
        // Synthetic author remains explicit; operator approval is the only authority proven here.
        StateKernel.VerifiedContext memory v = StateKernel.VerifiedContext(
            publication.header.principalId,
            e.ordinal,
            uint256(uint160(UpgradeStorage.control().operator)),
            e.coreCodehash
        );
        r = UpgradeAdmissionLibrary.admit(
            UpgradeStorage.efs(), v, publication, Preparation.Config(preparationHelper, preparationCodehash), e.ordinal
        );
        UpgradeStorage.control().usedNonces[nonce] = true;
        emit FixtureAdmissionResult(r.envelopeId, r.envelopeOrdinal, r.acceptingBatchId, r.leaves);
    }

    function counts() external view returns (StateStore.Counts memory) {
        return UpgradeStorage.efs().count;
    }

    function bootstrap() external view returns (StateStore.Bootstrap memory) {
        return UpgradeStorage.efs().init;
    }

    function record(bytes32 id) external view returns (StateStore.RecordRow memory) {
        return UpgradeStorage.efs().records[id];
    }

    function typeRow(bytes32 id) external view returns (StateStore.TypeRow memory) {
        return UpgradeStorage.efs().types[id];
    }

    function binding(bytes32 id) external view returns (StateStore.BindingRow memory) {
        return UpgradeStorage.efs().bindings[id];
    }

    function postingHead(bytes32 id) external view returns (uint256) {
        return UpgradeStorage.efs().postings[id].head;
    }
    error InventoryBounds();

    function bound(uint64 i, uint64 n) private pure {
        if (i == 0 || i > n) revert InventoryBounds();
    }

    function recordIdAt(uint64 i) external view returns (bytes32) {
        bound(i, UpgradeStorage.efs().count.records);
        return UpgradeStorage.efs().recordIds[i];
    }

    function envelopeIdAt(uint64 i) external view returns (bytes32) {
        bound(i, UpgradeStorage.efs().count.envelopes);
        return UpgradeStorage.efs().envelopeIds[i];
    }

    function typeIdAt(uint64 i) external view returns (bytes32) {
        bound(i, UpgradeStorage.efs().count.types);
        return UpgradeStorage.efs().typeIds[i];
    }

    function principalIdAt(uint64 i) external view returns (bytes32) {
        bound(i, UpgradeStorage.efs().count.principals);
        return UpgradeStorage.efs().principalIds[i];
    }

    function postingKeyAt(uint64 i) external view returns (bytes32) {
        bound(i, UpgradeStorage.efs().count.postingKeys);
        return UpgradeStorage.efs().postingKeys[i];
    }

    function bindingKeyAt(uint64 i) external view returns (bytes32) {
        bound(i, UpgradeStorage.efs().count.bindingKeys);
        return UpgradeStorage.efs().bindingKeys[i];
    }

    function envelope(bytes32 id) external view returns (StateStore.EnvelopeRow memory) {
        return UpgradeStorage.efs().envelopes[id];
    }

    function principal(bytes32 id) external view returns (StateStore.PrincipalRow memory) {
        return UpgradeStorage.efs().principals[id];
    }

    function admissionAt(uint64 i) external view returns (StateStore.AdmissionRow memory) {
        bound(i, UpgradeStorage.efs().count.admissions);
        return UpgradeStorage.efs().admissions[i];
    }

    function occurrence(bytes32 id, uint16 leaf) external view returns (StateStore.LifecycleRow memory) {
        return UpgradeStorage.efs().occurrences[StateKernel.occKey(id, leaf)];
    }

    function batchAt(uint64 i) external view returns (StateStore.BatchRow memory) {
        bound(i, UpgradeStorage.efs().count.batches);
        return UpgradeStorage.efs().batches[i];
    }

    function postingWord(bytes32 id, uint64 i) external view returns (uint256) {
        if (i >= (uint64(UpgradeStorage.efs().postings[id].head) + 4) / 5) revert InventoryBounds();
        return UpgradeStorage.efs().postingWords[id][i];
    }
}

contract UpgradeableFixtureCoreU2 is UpgradeableFixtureCore {
    constructor(address factory, address helper) UpgradeableFixtureCore(factory, helper) {}

    function migratePresentation(string calldata label, bool fail) external {
        _migrate(label, fail);
    }

    function presentationLabel() external view returns (string memory) {
        return UpgradeStorage.presentation().label;
    }
}
