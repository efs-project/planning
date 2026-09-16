// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {ContractSignatureEvidenceStore} from "../src/ContractSignatureEvidenceStore.sol";
contract SignaturePaidRead {
    bytes32 public hash;uint256 public length;
    function read(address store,address ledger,uint64 publication) external {
        ContractSignatureEvidenceStore.Evidence memory e=ContractSignatureEvidenceStore(store).evidence(ledger,publication);
        hash=keccak256(e.signature);length=e.signature.length;
    }
}
