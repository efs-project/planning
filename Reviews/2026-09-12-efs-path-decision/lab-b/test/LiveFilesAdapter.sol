// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {Ledger} from "../src/Ledger.sol";
import {IAcceptor} from "../src/Interfaces.sol";
import {Keys} from "../src/Keys.sol";
import {FilesLayout} from "./FilesJoinedProfile.sol";
import {LiveFilesLayout,LiveFilesDescriptorRule} from "./LiveFilesProfile.sol";

/// Output admission has a mandatory value<=100 predicate in addition to shape.
/// The live adapter must NOT invoke this as if it were the Ledger caller.
contract LiveQuoteRule is IAcceptor {
    function accept(bytes32,bytes calldata data,bytes32[] calldata refs) external pure returns(bool){
        return data.length==64&&refs.length==0&&uint256(bytes32(data[:32]))<=100&&uint256(bytes32(data[32:64]))<=1;
    }
}
contract LiveFilesAdapter {
    struct Observation {
        uint8 status; uint128 value; bool flag; bytes raw;
        uint256 blockNumber; uint256 chainId; address caller; address provider;
        bytes32 outputType; uint64 descriptorFirst;
    }
    Ledger public immutable ledger;
    bytes32 public immutable ledgerHash;
    bytes32 public immutable outputType;
    bytes32 public immutable expectedProviderRuntimeHash;
    LiveFilesDescriptorRule public immutable descriptorRule;
    bytes32 public immutable descriptorType;
    constructor(Ledger c,bytes32 t,bytes32 providerHash){
        ledger=c;ledgerHash=address(c).codehash;outputType=t;
        expectedProviderRuntimeHash=providerHash;
        descriptorRule=new LiveFilesDescriptorRule(address(this),t,providerHash);
        descriptorType=Keys.typeId(LiveFilesLayout.DESCRIPTOR,new bytes32[](0),address(descriptorRule).codehash);
    }
    // status: 0 INVALID_DESCRIPTOR, 1 SHAPE_ONLY, 2 UNSUPPORTED_CONTEXT,
    // 3 CALLER_MISMATCH, 4 CODE_DRIFT, 5 REVERT_OR_RESOURCE, 6 OVERSIZE,
    // 7 MALFORMED. Empty is invalid for this exact fixed64 representation.
    function observe(bytes32 id,uint64 through) external view returns(Observation memory result){
        result.blockNumber=block.number;result.chainId=block.chainid;result.caller=address(this);result.outputType=outputType;
        if(address(ledger).codehash!=ledgerHash)return result;
        (bytes32 t,uint64 first,uint32 length)=FilesLayout.header(ledger,id);
        if(t!=descriptorType||first==0||first>through||length!=384)return result;
        (,,,bytes memory body)=ledger.record(id);
        if(Keys.record(t,body)!=id)return result;
        LiveFilesLayout.Recipe memory r=abi.decode(body,(LiveFilesLayout.Recipe));
        result.descriptorFirst=first;result.provider=r.provider;
        if(r.version!=1||r.chainId!=block.chainid||r.venue!=LiveFilesLayout.VENUE||r.selector!=LiveFilesLayout.SELECTOR
            ||r.outputType!=outputType||r.representation!=1||r.callGas!=50000||r.maxReturn!=64){result.status=2;return result;}
        if(r.caller!=address(this)){result.status=3;return result;}
        if(r.providerHash!=expectedProviderRuntimeHash||r.provider.code.length==0||r.provider.codehash!=r.providerHash){result.status=4;return result;}
        bytes memory input=abi.encodeWithSelector(r.selector,r.key);
        address target=r.provider;bool ok;uint256 size;uint256 value;uint256 flag;
        // Fixed output buffer BEFORE call; never allocate from returndata size.
        assembly("memory-safe"){
            let out:=mload(0x40)
            ok:=staticcall(50000,target,add(input,32),mload(input),out,64)
            size:=returndatasize()
            value:=mload(out)
            flag:=mload(add(out,32))
        }
        if(!ok){result.status=5;return result;}
        if(size>64){result.status=6;return result;}
        if(size!=64||value>type(uint128).max||flag>1){result.status=7;return result;}
        result.status=1;result.value=uint128(value);result.flag=flag==1;result.raw=abi.encode(value,flag);
    }
}

/// Local fixture only: mutation modes are deliberate adversarial provider cases.
contract LiveQuoteProvider {
    uint128 public value=42; bool public flag=true; uint8 public mode; address public expectedCaller;
    function update(uint128 v,bool f,uint8 m,address caller) external {value=v;flag=f;mode=m;expectedCaller=caller;}
    function quote(bytes32) external view returns(uint128,bool){
        require(expectedCaller==address(0)||msg.sender==expectedCaller,"caller mismatch");
        if(mode==1)revert("provider unavailable");
        if(mode==2)assembly("memory-safe"){return(0,4096)}
        if(mode==3)assembly("memory-safe"){mstore(0,1)mstore(32,2)return(0,64)}
        if(mode==4)assembly("memory-safe"){for {} 1 {} {}}
        if(mode==5)assembly("memory-safe"){return(0,0)}
        if(mode==6)assembly("memory-safe"){mstore(0,shl(200,1))mstore(32,0)return(0,64)}
        return(value,flag);
    }
}
