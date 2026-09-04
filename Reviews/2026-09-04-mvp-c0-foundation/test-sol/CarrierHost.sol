// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {C0RunCodec as C} from "../src/C0RunCodec.sol";
import {MvpC0StateByteStore as Store} from "../src/MvpC0StateByteStore.sol";

/// @notice MUTABLE TEST DOUBLE ONLY. No Core admission, genesis, authorization, or receipt semantics.
contract CarrierHost {
    bytes32 private seed;
    bytes32 private commitment;
    bytes32 private treeType;
    uint8 private phase;
    error EnclosingRollback();

    function setContext(bytes32 s, bytes32 c, bytes32 t, uint8 p) external {
        seed = s;
        commitment = c;
        treeType = t;
        phase = p;
    }

    function c0CarrierContext() external view returns (bytes32, bytes32, bytes32, uint8) {
        return (seed, commitment, treeType, phase);
    }

    function seal(Store store, bytes calldata deployment) external {
        store.sealFromCore(deployment);
    }

    function initialize(Store store, bytes calldata deployment, bytes32 t, bool rollback) external {
        C.Deployment memory d = C.decodeDeployment(deployment);
        seed = d.experimentSeed;
        commitment = C.experimentCommitment(d);
        treeType = t;
        phase = 1;
        store.sealFromCore(deployment);
        if (rollback) revert EnclosingRollback();
    }

    function put(Store store, bytes32 id, bytes calldata body, bytes calldata data) external {
        store.putFromCore(id, body, data);
    }

    function putAndRevert(Store store, bytes32 id, bytes calldata body, bytes calldata data) external {
        store.putFromCore(id, body, data);
        revert EnclosingRollback();
    }
}
