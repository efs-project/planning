// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {LabRead} from "./LabRead.sol";
/// @notice Stateless compile-in helper example, not an authoritative SDK service.
contract LabReadConsumer {
    function currentFile(address core,bytes32 codeHash,bytes32 runId,uint16 profile,bytes32 fileId) external view returns(LabRead.FileResult memory) { return LabRead.currentFile(core,codeHash,runId,profile,fileId); }
    function score(address core,bytes32 codeHash,bytes32 runId,uint16 profile,bytes32 recordId,bytes32 schemaId) external view returns(LabRead.Status,uint64) { return LabRead.score(core,codeHash,runId,profile,recordId,schemaId); }
}
