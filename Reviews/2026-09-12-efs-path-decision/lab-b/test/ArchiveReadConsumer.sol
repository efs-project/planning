// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {SignedClaimArchiveBase} from "../src/SignedClaimArchive.sol";
import {Ledger} from "../src/Ledger.sol";

/// DISPOSABLE LAB paid-read boundary; no storage and no authority proof.
contract ArchiveReadConsumer {
    event ActionRead(bytes32 indexed claimId, uint16 indexed leaf, bytes32 actionHash);
    event PreimagesRead(bytes32 readBytesHash, bytes32 executionBytesHash);

    function readAction(address archive, bytes32 claimId, uint16 leaf) external {
        Ledger.Action memory action = SignedClaimArchiveBase(archive).actionAt(claimId, leaf);
        emit ActionRead(claimId, leaf, keccak256(abi.encode(action)));
    }
    function readPreimages(address archive, bytes32 readSetHash, bytes32 executionSet)
        external returns (bytes32 readBytesHash, bytes32 executionBytesHash) {
        (bool present,bytes memory raw)=SignedClaimArchiveBase(archive).readSetBytes(readSetHash);
        require(present,"missing read set");
        (bool known,Ledger.ExecutionInfo memory execution)=SignedClaimArchiveBase(archive).executionInfo(executionSet);
        require(known,"missing execution");
        readBytesHash=keccak256(raw);executionBytesHash=keccak256(abi.encode(execution));
        emit PreimagesRead(readBytesHash,executionBytesHash);
    }
}
