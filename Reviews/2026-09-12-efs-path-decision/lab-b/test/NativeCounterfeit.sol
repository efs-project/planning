// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
/// Adversarial fixtures, NOT supported deployments. Their constructors/admin
/// can manufacture historical rows while returning/restoring expected runtime.
contract NativeCounterfeitConstructor {
    constructor(bytes memory runtime,bytes32[] memory keys,uint256[] memory values){
        require(keys.length==values.length);
        for(uint256 i;i<keys.length;i++){bytes32 key=keys[i];uint256 value=values[i];assembly("memory-safe"){sstore(key,value)}}
        assembly("memory-safe"){return(add(runtime,32),mload(runtime))}
    }
}
contract NativeMaliciousWriter {
    function preload(bytes32[] memory keys,uint256[] memory values) external {
        require(keys.length==values.length);
        for(uint256 i;i<keys.length;i++){bytes32 key=keys[i];uint256 value=values[i];assembly("memory-safe"){sstore(key,value)}}
    }
}
contract NativeRestorableProxy {
    bytes32 constant SLOT=bytes32(uint256(keccak256("eip1967.proxy.implementation"))-1);
    address immutable admin=msg.sender;
    constructor(address implementation){bytes32 slot=SLOT;assembly("memory-safe"){sstore(slot,implementation)}}
    function restore(address implementation) external {require(msg.sender==admin);bytes32 slot=SLOT;assembly("memory-safe"){sstore(slot,implementation)}}
    fallback() external {
        bytes32 slot=SLOT;
        assembly("memory-safe"){
            let target:=sload(slot)
            calldatacopy(0,0,calldatasize())
            let ok:=delegatecall(gas(),target,0,calldatasize(),0,0)
            returndatacopy(0,0,returndatasize())
            switch ok case 0 {revert(0,returndatasize())} default {return(0,returndatasize())}
        }
    }
}
