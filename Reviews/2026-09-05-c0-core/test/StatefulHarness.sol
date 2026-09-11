// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import {StateStore} from "../src/StateStore.sol";
import {Preparation} from "../src/Preparation.sol";
import {StateKernel} from "../src/StateKernel.sol";
import {AdmissionLibrary} from "../src/AdmissionLibrary.sol";
import {TypeGroupParser} from "C0Admission/TypeGroupParser.sol";

/// @notice Unauthenticated test host, never a public Core authority interface.
contract StatefulHarness {
    StateStore.Store internal s;
    address public immutable preparationHelper;
    bytes32 public immutable preparationCodehash;
    address public immutable admissionLibrary;
    bytes32 public immutable admissionCodehash;
    error AdmissionCodeMismatch();
    event TrustedHostAdmissionResult(
        bytes32 indexed envelopeId, uint64 envelopeOrdinal, uint64 acceptingBatchId, StateKernel.LeafResult[] leaves
    );

    constructor(StateKernel.Init memory init, address helper, bytes32 codehash, bytes32 libraryHash) {
        if (address(AdmissionLibrary).code.length == 0 || address(AdmissionLibrary).codehash != libraryHash) {
            revert AdmissionCodeMismatch();
        }
        admissionLibrary = address(AdmissionLibrary);
        admissionCodehash = libraryHash;
        preparationHelper = helper;
        preparationCodehash = codehash;
        StateKernel.initialize(s, init, Preparation.Config(helper, codehash));
    }

    function publishTrustedForTest(StateKernel.VerifiedContext memory v, StateKernel.Publication memory p)
        external
        returns (StateKernel.AdmitResult memory r)
    {
        // Exact compiler-linked target; this library has full Core storage authority.
        if (address(AdmissionLibrary).code.length == 0 || address(AdmissionLibrary).codehash != admissionCodehash) {
            revert AdmissionCodeMismatch();
        }
        r = AdmissionLibrary.admit(s, v, p, Preparation.Config(preparationHelper, preparationCodehash));
        emit TrustedHostAdmissionResult(r.envelopeId, r.envelopeOrdinal, r.acceptingBatchId, r.leaves);
    }

    function counts() external view returns (StateStore.Counts memory) {
        return s.count;
    }

    function bootstrap() external view returns (StateStore.Bootstrap memory) {
        return s.init;
    }

    function record(bytes32 id) external view returns (StateStore.RecordRow memory) {
        return s.records[id];
    }

    function typeRow(bytes32 id) external view returns (StateStore.TypeRow memory) {
        return StateStore.typeRow(s, id);
    }

    function binding(bytes32 id) external view returns (StateStore.BindingRow memory) {
        return s.bindings[id];
    }

    function postingHead(bytes32 id) external view returns (uint256) {
        return s.postings[id].head;
    }
    error InventoryBounds();

    function bound(uint64 i, uint64 n) private pure {
        if (i == 0 || i > n) revert InventoryBounds();
    }

    function recordIdAt(uint64 i) external view returns (bytes32) {
        bound(i, s.count.records);
        return s.recordIds[i];
    }

    function envelopeIdAt(uint64 i) external view returns (bytes32) {
        bound(i, s.count.envelopes);
        return s.envelopeIds[i];
    }

    function typeIdAt(uint64 i) external view returns (bytes32) {
        bound(i, s.count.types);
        return s.typeIds[i];
    }

    function principalIdAt(uint64 i) external view returns (bytes32) {
        bound(i, s.count.principals);
        return s.principalIds[i];
    }

    function postingKeyAt(uint64 i) external view returns (bytes32) {
        bound(i, s.count.postingKeys);
        return s.postingKeys[i];
    }

    function bindingKeyAt(uint64 i) external view returns (bytes32) {
        bound(i, s.count.bindingKeys);
        return s.bindingKeys[i];
    }

    function envelope(bytes32 id) external view returns (StateStore.EnvelopeRow memory) {
        return s.envelopes[id];
    }

    function principal(bytes32 id) external view returns (StateStore.PrincipalRow memory) {
        return s.principals[id];
    }

    function admissionAt(uint64 i) external view returns (StateStore.AdmissionRow memory) {
        bound(i, s.count.admissions);
        return s.admissions[i];
    }

    function occurrence(bytes32 id, uint16 leaf) external view returns (StateStore.LifecycleRow memory) {
        return s.occurrences[StateKernel.occKey(id, leaf)];
    }

    function batchAt(uint64 i) external view returns (StateStore.BatchRow memory) {
        bound(i, s.count.batches);
        return s.batches[i];
    }

    function postingWord(bytes32 id, uint64 i) external view returns (uint256) {
        if (i >= (uint64(s.postings[id].head) + 4) / 5) revert InventoryBounds();
        return s.postingWords[id][i];
    }
}

/// @notice Explicit unauthenticated test setup, not a pre-withdrawal/authority API.
contract SyntheticStatefulHarness is StatefulHarness {
    constructor(StateKernel.Init memory init, address helper, bytes32 helperHash, bytes32 libraryHash)
        StatefulHarness(init, helper, helperHash, libraryHash)
    {}

    function seedAdmissionCountForTest(uint64 n) external {
        s.count.admissions = n;
    }

    function seedPreWithdrawnForTest(bytes32 env, uint16 leaf) external {
        s.occurrences[StateKernel.occKey(env, leaf)].packed = 3;
    }

    function seedRevisionForTest(bytes32 key, uint32 revision) external {
        s.bindings[key].meta = (s.bindings[key].meta & ~(uint256(type(uint32).max) << 8)) | (uint256(revision) << 8);
    }
}

contract DependencyHarness {
    function parse(bytes memory b)
        external
        pure
        returns (bytes32, TypeGroupParser.SchemaCache[] memory, bytes32[] memory)
    {
        return TypeGroupParser.parseWithDependencies(b);
    }

    function strict(bytes memory b, bytes32[] memory d)
        external
        pure
        returns (bytes32, TypeGroupParser.SchemaCache[] memory)
    {
        return TypeGroupParser.parse(b, d);
    }
}
