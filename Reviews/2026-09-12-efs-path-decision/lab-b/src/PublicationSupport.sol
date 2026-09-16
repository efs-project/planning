// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {IIndexModule, ITypeRegistry} from "./Interfaces.sol";
import {IndexWork} from "./IndexWork.sol";
import {IndexFieldProfile} from "./IndexFieldProfile.sol";

/// Fixed, constructor-created stateless dispatch dependency. Ledger alone selects
/// this immutable DELEGATECALL target; module is only a CALL/STATICCALL recipient.
/// Owns no storage and cannot delegate to a caller-supplied address.
contract PublicationSupport {
    error E_INDEX(bytes data);
    error E_GAS();
    error E_INDEX_RETURNDATA(uint256 size);
    error E_READSET_SHAPE();
    error E_BOUNDS(uint256 code);

    struct ReadSet {bytes32[] principalIds;bytes32[] positions;bytes32[] expectedHeads;}

    /// Fixed-output quote from bounded action bytes and canonical Type refs.
    /// Body work conservatively charges all256 possible words for each authored
    /// occurrence; actual index reads are sparse. Reuse/duplicate bodies may
    /// overquote, but unused budget is never demanded as an outer-gas reserve.
    function indexAllowance(address module,address registry,bytes calldata encoded) external view returns(uint256 budget){
        uint256 n;uint256 offset;
        assembly("memory-safe"){offset:=calldataload(encoded.offset) n:=calldataload(add(encoded.offset,32))}
        if(n==0||n>64||offset!=32||encoded.length!=64+n*288)revert E_BOUNDS(0);
        budget=IndexWork.BASE+IndexWork.ACTION*n;
        if(module==address(0))return budget;
        uint256 profileWord=uint256(_fixedRead(module,abi.encodeWithSignature("fieldProfile()"),30_000));
        if(profileWord>type(uint160).max)revert E_INDEX("");
        address profile=address(uint160(profileWord));
        for(uint256 i;i<n;i++){
            uint256 kind;bytes32 t;
            assembly("memory-safe"){
                let ptr:=add(add(encoded.offset,64),mul(i,288))
                kind:=calldataload(ptr) t:=calldataload(add(ptr,32))
            }
            if(kind!=1&&kind!=2)continue;
            (,,,,,uint8 refs,)=ITypeRegistry(registry).typeInfo(t);
            if(refs>8)revert E_BOUNDS(4);
            uint256 declarations=profile==address(0)?0:uint256(_fixedRead(profile,abi.encodeCall(IndexFieldProfile.workUnits,(t)),30_000));
            if(declarations>5)revert E_BOUNDS(4);
            budget+=IndexWork.REFERENCE*refs+IndexWork.DECLARATION*declarations+IndexWork.BODY_WORD*256;
        }
        if(budget>IndexWork.MAXIMUM)budget=IndexWork.MAXIMUM;
    }

    function _fixedRead(address target,bytes memory input,uint256 gasLimit) private view returns(bytes32 word){
        bool ok;uint256 size;
        assembly("memory-safe"){
            let ptr:=mload(0x40)
            ok:=staticcall(gasLimit,target,add(input,32),mload(input),ptr,32)
            size:=returndatasize() word:=mload(ptr)
        }
        if(!ok||size!=32)revert E_INDEX("");
    }

    function indexObligations(address module) external view returns(bytes32){
        if(module==address(0))return 0;
        bytes memory input=abi.encodeWithSelector(IIndexModule.manifestHash.selector);
        bytes32 manifest;bool ok;uint256 size;
        assembly("memory-safe"){
            let ptr:=mload(0x40)
            ok:=staticcall(100000,module,add(input,32),mload(input),ptr,32)
            size:=returndatasize() manifest:=mload(ptr)
        }
        if(!ok||size!=32||manifest==0)revert E_INDEX("");
        return keccak256(abi.encode(module,module.codehash,manifest));
    }

    /// Static publication codecs. No canonical storage, authority, head comparison
    /// or Type-rule invocation is delegated to this helper.
    function readSetHash(bytes calldata encoded) external pure returns(bytes32) {
        if(encoded.length>10_592)revert E_READSET_SHAPE();
        ReadSet memory rs=abi.decode(encoded,(ReadSet));
        uint256 n=rs.principalIds.length;uint256 m=rs.positions.length;
        if(n>64 || m>4 || rs.expectedHeads.length!=n*m || (n==0)!=(m==0))revert E_READSET_SHAPE();
        for(uint256 i;i<n;i++){
            if(rs.principalIds[i]==0)revert E_READSET_SHAPE();
            for(uint256 j;j<i;j++)if(rs.principalIds[i]==rs.principalIds[j])revert E_READSET_SHAPE();
        }
        for(uint256 i;i<m;i++){
            if(rs.positions[i]==0)revert E_READSET_SHAPE();
            for(uint256 j;j<i;j++)if(rs.positions[i]==rs.positions[j])revert E_READSET_SHAPE();
        }
        return keccak256(abi.encode(keccak256("efs.lab.read-set/2:ordered-first-binding"),rs));
    }

    function acceptanceProfile(address registry,bytes calldata encoded) external view returns(bytes32 profile) {
        uint256 n;uint256 offset;
        assembly ("memory-safe"){offset:=calldataload(encoded.offset) n:=calldataload(add(encoded.offset,32))}
        // Preserve the public getter's ability to hash oversized candidates; Core
        // still refuses more than 64 actions at admission. Validate the exact
        // fixed-width ABI without multiplication overflow or trusting n alone.
        // Unknown Types retain their former zero row; _typeOf refuses admission.
        if(encoded.length<64 || offset!=32 || (encoded.length-64)%288!=0 || n!=(encoded.length-64)/288)revert E_BOUNDS(0);
        ITypeRegistry types=ITypeRegistry(registry);
        profile=keccak256(abi.encode(keccak256("efs.lab.acceptance-profile/2"),registry,types.epoch()));
        for(uint256 i;i<n;i++){
            uint256 kind;bytes32 typeId;
            assembly ("memory-safe") {
                let ptr:=add(add(encoded.offset,64),mul(i,288))
                kind:=calldataload(ptr) typeId:=calldataload(add(ptr,32))
            }
            if(kind!=1 && kind!=2)continue;
            (,address mandatory,bytes32 ruleId,address policy,bytes32 policyCodehash,,uint16 activation)=types.typeInfo(typeId);
            profile=keccak256(abi.encode(profile,typeId,mandatory,ruleId,policy,policyCodehash,activation));
        }
    }

    /// Private wire format: module, remaining budget, final flag, publication,
    /// effect count, then 12 fixed ABI words per Effect. There are no dynamic
    /// members. Checked here as well as at the Ledger's bounded action ingress.
    fallback(bytes calldata raw) external returns(bytes memory) {
        address module;uint256 budget;bool finalPhase;uint256 publication;uint256 n;
        assembly ("memory-safe") {
            module:=calldataload(0) budget:=calldataload(32) finalPhase:=calldataload(64)
            publication:=calldataload(96) n:=calldataload(128)
        }
        if(n==0 || n>64 || raw.length!=160+n*384)revert E_INDEX("");
        bytes4 selector=finalPhase ? IIndexModule.afterPublication.selector : IIndexModule.onAdmission.selector;
        bytes memory input=new bytes(100+n*384);
        assembly ("memory-safe") {
            let data:=add(input,32)
            mstore(data,selector) mstore(add(data,4),publication)
            mstore(add(data,36),64) mstore(add(data,68),n)
            calldatacopy(add(data,100),160,mul(n,384))
        }
        // An unused joint allowance is not a mandatory outer-gas reserve. Reserve
        // bounded error/return accounting, then obey EIP-150's actual available gas.
        uint256 available=gasleft();
        if(available<=20_000)revert E_GAS();
        available=(available-20_000)*63/64;
        if(budget>available)budget=available;
        bool ok;uint256 returned;bytes memory result=new bytes(32);
        assembly ("memory-safe") {
            switch finalPhase
            case 0 {ok:=call(budget,module,0,add(input,32),mload(input),add(result,32),32)}
            default {ok:=staticcall(budget,module,add(input,32),mload(input),add(result,32),32)}
            returned:=returndatasize()
        }
        // Exact errors are retained up to this named diagnostic bound; oversized
        // success or revert data is refused without copying/decoding the payload.
        if(returned>4096)revert E_INDEX_RETURNDATA(returned);
        if(!ok){
            bytes memory reason=new bytes(returned);
            assembly ("memory-safe"){returndatacopy(add(reason,32),0,returned)}
            revert E_INDEX(reason);
        }
        if(finalPhase && (returned!=32 || bytes4(result)!=IIndexModule.afterPublication.selector))revert E_INDEX("");
        return "";
    }
}
