// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

library ContractSignatureProfile {
    bytes32 internal constant ID=keccak256("efs.lab.erc1271/1:ordinary-deployed:4096:300000:static:exact32:pre-publication");
    bytes32 internal constant EVIDENCE=keccak256("efs.lab.contract-signature-evidence/1");
}

/// Immutable exact bytes, including a real STOP-only empty-signature carrier.
contract ContractSignatureCode {
    constructor(bytes memory signature) {
        bytes memory runtime=bytes.concat(hex"00",signature);
        assembly("memory-safe"){return(add(runtime,32),mload(runtime))}
    }
}

/// Write-once namespace is the actual calling Ledger/proxy, never an argument.
/// The typed getter preserves existence independently of signature length.
contract ContractSignatureEvidenceStore {
    struct Evidence {bytes32 digest;bytes32 walletCodehash;bytes32 profile;bytes32 evidenceHash;address carrier;bytes signature;}
    struct Row {bytes32 digest;bytes32 walletCodehash;bytes32 evidenceHash;address carrier;}
    mapping(address=>mapping(uint64=>Row)) private rows;
    error E_SIGNATURE_EVIDENCE();
    function profile() external pure returns(bytes32){return ContractSignatureProfile.ID;}
    function retain(uint64 publication,bytes32 digest,bytes32 walletCodehash,bytes calldata signature) external returns(bytes32 h) {
        if(publication==0||digest==0||walletCodehash==0||signature.length>4096||rows[msg.sender][publication].carrier!=address(0))revert E_SIGNATURE_EVIDENCE();
        h=keccak256(abi.encode(ContractSignatureProfile.EVIDENCE,address(this),msg.sender,publication,digest,
            ContractSignatureProfile.ID,walletCodehash,keccak256(signature)));
        rows[msg.sender][publication]=Row(digest,walletCodehash,h,address(new ContractSignatureCode(signature)));
    }
    function evidence(address ledger,uint64 publication) external view returns(Evidence memory e) {
        Row storage r=rows[ledger][publication];
        address carrier=r.carrier;
        uint256 size=carrier.code.length;
        if(carrier==address(0)||size==0||size>4097)revert E_SIGNATURE_EVIDENCE();
        bytes memory runtime=carrier.code;
        if(runtime[0]!=0)revert E_SIGNATURE_EVIDENCE();
        bytes memory signature=new bytes(size-1);
        assembly("memory-safe"){mcopy(add(signature,32),add(runtime,33),sub(size,1))}
        e=Evidence(r.digest,r.walletCodehash,ContractSignatureProfile.ID,r.evidenceHash,carrier,signature);
        if(keccak256(abi.encode(ContractSignatureProfile.EVIDENCE,address(this),ledger,publication,e.digest,
            e.profile,e.walletCodehash,keccak256(signature)))!=e.evidenceHash)revert E_SIGNATURE_EVIDENCE();
    }
}
