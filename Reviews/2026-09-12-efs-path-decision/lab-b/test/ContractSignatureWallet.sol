// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {Ledger} from "../src/Ledger.sol";

/// Disposable real deployed wallet. Mutable approvals/controller demonstrate why
/// retained source acceptance is not today's wallet validity.
contract ContractSignatureWallet {
    address public controller;
    address public ledger;
    bytes32 public digest;
    bytes32 public signatureHash;
    uint256 public mode;
    uint256 public writes;
    address public oracle;
    constructor(address caller) { controller=msg.sender; ledger=caller; }
    function approve(bytes32 d,bytes calldata signature) external {
        require(msg.sender==controller);digest=d;signatureHash=keccak256(signature);
    }
    function configure(uint256 m) external {require(msg.sender==controller);mode=m;}
    function rotate(address next) external {require(msg.sender==controller);controller=next;digest=0;}
    function dependency(address next) external {require(msg.sender==controller);oracle=next;}
    function isValidSignature(bytes32 d,bytes calldata signature) external returns(bytes4) {
        require(msg.sender==ledger,"caller");
        uint256 m=mode;
        if(m==1)revert("wallet refusal");
        if(m==2){while(true){}}
        if(m==3){writes++;}
        if(m==4){Ledger(ledger).create(bytes32("reentry"));}
        if(m==5){assembly("memory-safe"){mstore(0,shl(224,0x1626ba7e)) return(0,4)}}
        if(m==6){assembly("memory-safe"){mstore(0,or(shl(224,0x1626ba7e),1)) return(0,32)}}
        if(m==7){assembly("memory-safe"){mstore(0,shl(224,0x1626ba7e)) return(0,8192)}}
        if(m==8)return bytes4(0xffffffff);
        if(m==9){
            if(signature.length!=65)return bytes4(0xffffffff);
            bytes32 r;bytes32 s;uint8 v;
            assembly("memory-safe"){r:=calldataload(signature.offset) s:=calldataload(add(signature.offset,32)) v:=byte(0,calldataload(add(signature.offset,64)))}
            return ecrecover(d,v,r,s)==controller?bytes4(0x1626ba7e):bytes4(0xffffffff);
        }
        if(m==10)return SignatureApprovalOracle(oracle).check(d,keccak256(signature))?bytes4(0x1626ba7e):bytes4(0xffffffff);
        return d==digest&&keccak256(signature)==signatureHash?bytes4(0x1626ba7e):bytes4(0xffffffff);
    }
    function nativeCreate(bytes32 salt) external {require(msg.sender==controller);Ledger(ledger).create(salt);}
    function executeThenRevert(bytes calldata data) external {
        require(msg.sender==controller);(bool ok,)=ledger.call(data);require(ok,"inner");revert("app rollback");
    }
}

contract SignatureApprovalOracle {
    bytes32 public digest;bytes32 public signatureHash;bool public mutableCheck;uint256 public writes;
    function approve(bytes32 d,bytes32 s,bool mutate) external {digest=d;signatureHash=s;mutableCheck=mutate;}
    function check(bytes32 d,bytes32 s) external returns(bool){if(mutableCheck)writes++;return d==digest&&s==signatureHash;}
}

/// Real replaceable delegate wallet. Only the shell hash is observed by Ledger;
/// implementation and storage history are intentionally not inferred from it.
contract ContractSignatureWalletProxy {
    address public controller;address public ledger;
    bytes32 private constant SLOT=keccak256("efs.lab.wallet-fixture.implementation");
    constructor(address ledger_,address implementation){controller=msg.sender;ledger=ledger_;_set(implementation);}
    function upgrade(address implementation) external {require(msg.sender==controller);_set(implementation);}
    function _set(address implementation) private {bytes32 slot=SLOT;assembly("memory-safe"){sstore(slot,implementation)}}
    fallback() external {
        bytes32 slot=SLOT;
        assembly("memory-safe"){
            let implementation:=sload(slot)
            calldatacopy(0,0,calldatasize())
            let ok:=delegatecall(gas(),implementation,0,calldatasize(),0,0)
            returndatacopy(0,0,returndatasize())
            switch ok case 0 {revert(0,returndatasize())} default {return(0,returndatasize())}
        }
    }
}

contract RefusingWalletImplementation {function isValidSignature(bytes32,bytes calldata) external pure returns(bytes4){return bytes4(0xffffffff);}}
