// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {SignedClaimArchiveBase} from "../src/SignedClaimArchive.sol";
import {Ledger} from "../src/Ledger.sol";

/// DISPOSABLE LAB paid-read boundary; no storage and no authority proof.
contract ArchiveReadConsumer {
    event ActionRead(bytes32 indexed claimId, uint16 indexed leaf, bytes32 actionHash);

    function readAction(address archive, bytes32 claimId, uint16 leaf) external {
        Ledger.Action memory action = SignedClaimArchiveBase(archive).actionAt(claimId, leaf);
        emit ActionRead(claimId, leaf, keccak256(abi.encode(action)));
    }
}
