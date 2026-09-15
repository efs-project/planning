// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {Ledger} from "../src/Ledger.sol";
import {LensReader} from "../src/LensReader.sol";
import {FilesCarrierIndex} from "./FilesCarrierProfile.sol";
import {Keys} from "../src/Keys.sol";

/// Test-only carrier-aware application. This narrower fixture supports the
/// inline, unencrypted raw-sha256 arm, not remote bytes or decryption. Reads and
/// checks the selected source bytes in the same call that writes its own child.
contract RecoveryCarrierApplication {
    Ledger public immutable core;
    LensReader public immutable lens;
    FilesCarrierIndex public immutable index;
    address public immutable operator;
    bytes32 public immutable sourcePrincipal;
    bytes32 public immutable indexHash;
    uint64 public adoptionCount;
    bytes32 public lastRevision;
    bytes32 private constant HEAD=keccak256("efs2/purpose/head/1");
    error E_SOURCE();
    error E_PROFILE();
    constructor(Ledger c,LensReader l,FilesCarrierIndex ix,address op,address source) {
        require(address(c.indexModule())==address(ix) && ix.ledger()==address(c)
            && address(l.ledger())==address(c) && address(l.index())==address(ix) && op!=address(0),"APP_PROFILE");
        core=c;lens=l;index=ix;operator=op;sourcePrincipal=c.keyPrincipal(source);indexHash=address(ix).codehash;
    }
    function adopt(bytes32 file,bytes32 expectedRevision,bytes32 expectedSHA256,bytes32 execution)
        external returns(bytes32 revision,uint64 publication) {
        if(msg.sender!=operator || address(index).codehash!=indexHash || core.executionSet()!=execution
            || core.indexModule()!=address(index))revert E_PROFILE();
        bytes32[] memory authors=new bytes32[](1);authors[0]=sourcePrincipal;
        (uint8 state,bytes32 selected,,,)=lens.resolvePrincipals(authors,HEAD,file,bytes32(0),execution);
        if(state!=1 || selected!=expectedRevision)revert E_SOURCE();
        (bytes32 t,,,bytes memory parent)=core.record(selected);
        bytes32 content;
        if(t==index.carrierTypes(2) && parent.length==64) {
            bytes32 parentFile;(content,parentFile)=abi.decode(parent,(bytes32,bytes32));if(parentFile!=file)revert E_SOURCE();
        }else if(t==index.carrierTypes(3) && parent.length==96) {
            bytes32 parentFile;(,content,parentFile)=abi.decode(parent,(bytes32,bytes32,bytes32));if(parentFile!=file)revert E_SOURCE();
        }else revert E_PROFILE();
        if(Keys.record(t,parent)!=selected)revert E_SOURCE();
        bytes memory descriptor=_record(content,index.carrierTypes(1));
        if(descriptor.length!=352)revert E_PROFILE();uint256[11] memory d=abi.decode(descriptor,(uint256[11]));
        if(d[1]!=1 || d[2]!=0 || d[3]!=1 || d[4]>8160 || d[6]>2 || d[7]!=0 || d[8]!=0
            || d[9]!=d[4] || d[10]!=d[5] || bytes32(d[5])!=expectedSHA256)revert E_PROFILE();
        bytes memory retained=_record(bytes32(d[0]),index.carrierTypes(0));
        if(retained.length!=d[4]+32)revert E_SOURCE();
        bytes memory raw=new bytes(d[4]);for(uint256 j;j<raw.length;j++)raw[j]=retained[j+32];
        bytes32 retainedHash;assembly("memory-safe"){retainedHash:=mload(add(retained,32))}
        if(sha256(raw)!=expectedSHA256 || retainedHash!=expectedSHA256)revert E_SOURCE();
        bytes memory child=abi.encode(selected,content,file);bytes32 childType=index.carrierTypes(3);
        revision=Keys.record(childType,child);
        Ledger.Action[] memory a=new Ledger.Action[](2);bytes[] memory b=new bytes[](2);
        a[0].kind=1;a[0].typeId=childType;a[0].bodyHashOrRecordId=keccak256(child);b[0]=child;
        a[1].kind=3;a[1].purpose=HEAD;a[1].subject=file;a[1].target=revision;
        (,uint32 ownRevision,,,,)=core.head(Keys.binding(core.principalOf(address(this)),Keys.position(HEAD,file,bytes32(0))));
        a[1].expectedRevision=ownRevision;
        bytes32[] memory positions=new bytes32[](1);positions[0]=Keys.position(HEAD,file,bytes32(0));
        bytes32[] memory snapshots=new bytes32[](1);snapshots[0]=core.headSnapshot(sourcePrincipal,positions[0]);
        (publication,)=core.executeGuarded(a,b,core.nonces(address(this)),execution,Ledger.ReadSetV2(authors,positions,snapshots));
        ++adoptionCount;lastRevision=revision;
    }
    function _record(bytes32 id,bytes32 expectedType) private view returns(bytes memory body) {
        (bytes32 t,uint64 first,,bytes memory data)=core.record(id);
        if(t!=expectedType || first==0 || Keys.record(t,data)!=id)revert E_SOURCE();return data;
    }
}
