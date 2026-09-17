// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {IndexSource, IIndexSource} from "./IndexSource.sol";
import {Keys} from "./Keys.sol";
import {ExecutionSlots} from "./ExecutionSlots.sol";

interface IReplayLedger is IIndexSource {
    function layoutId() external view returns(bytes32);
    function implementationCodeHash() external view returns(bytes32);
    function indexModule() external view returns(address);
}

/// Canonical immutable facts only. Never reads current heads, occurrence counts,
/// withdrawal flags, or mutable acceptance policy to reconstruct past effects.
library IndexReplaySource {
    uint256 private constant MASK48=(1<<48)-1;
    bytes32 internal constant LAYOUT=keccak256("efs.lab.ledger-layout/2:roots-0-12-preserved:context-13:execution-14:readsets-15");
    struct Fact {
        uint8 kind;
        uint64 admission;
        bytes32 author;
        bytes32 recordId;
        bytes32 typeId;
        bytes32 scopeKey;
        bytes32 bindingKey;
        uint64 bindingOrdinal;
        uint32 expectedRevision;
        uint64 withdrawalTarget;
    }
    error E_REPLAY_SOURCE();
    function at(address source,bytes32 base,uint256 offset) private view returns(bytes32){
        return IIndexSource(source).extsload(bytes32(uint256(base)+offset));
    }
    function root(uint256 key,uint256 slot) private pure returns(bytes32){return keccak256(abi.encode(key,slot));}
    function principal(address source,uint64 pub) private view returns(bytes32 p){
        bytes32 base=root(pub,13);p=at(source,base,0);
        uint8 format=uint8(uint256(at(source,base,4))>>16);
        bytes32 execution=at(source,base,1);
        bytes32 executionBase=keccak256(abi.encode(execution,uint256(14)));
        if(p==0 || (format!=1&&format!=2) || execution==0
            ||at(source,executionBase,2)!=source.codehash
            ||at(source,executionBase,4)!=IReplayLedger(source).implementationCodeHash())revert E_REPLAY_SOURCE();
    }
    function recordFact(address source,uint256 meta,bytes32 a,bytes32 b,uint64 ordinal)
        private view returns(bytes32 id,bytes32 t)
    {
        uint8 kind=uint8(meta&15);
        if(kind!=1&&kind!=2)revert E_REPLAY_SOURCE();
        id=kind==1?Keys.recordFromHash(b,a):a;
        uint64 first;uint32 length;(t,first,length)=IndexSource.header(source,id);
        if(t==0 || first==0 || first>ordinal || length>8192 || (kind==1&&t!=b))revert E_REPLAY_SOURCE();
    }
    function publication(address source,uint64 p,uint64 expectedFirst) internal view returns(Fact[] memory facts){
        uint256 ev=uint256(at(source,root(p,6),0));
        uint64 first=uint64((ev>>188)&MASK48);uint256 n=(ev>>172)&0xffff;
        (uint64 current,,,uint64 pubs)=IIndexSource(source).counts();
        if(p==0||p>pubs||n==0||n>64||first!=expectedFirst||uint256(first)+n-1>current)revert E_REPLAY_SOURCE();
        if(uint256(first)+n<=current&&((uint256(at(source,root(uint256(first)+n,5),0))>>20)&MASK48)==p)revert E_REPLAY_SOURCE();
        bytes32 author=principal(source,p);
        facts=new Fact[](n);
        for(uint256 i;i<n;i++){
            Fact memory f;f.admission=first+uint64(i);f.author=author;
            bytes32 base=root(f.admission,5);uint256 meta=uint256(at(source,base,0));
            f.kind=uint8(meta&15);bytes32 a=at(source,base,1);bytes32 b=at(source,base,2);
            if(f.kind==0||f.kind>7||((meta>>4)&0xffff)!=i||((meta>>20)&MASK48)!=p)revert E_REPLAY_SOURCE();
            if(f.kind==1||f.kind==2){
                (f.recordId,f.typeId)=recordFact(source,meta,a,b,f.admission);
            }else if(f.kind==3||f.kind==4||f.kind==7){
                f.bindingOrdinal=uint64((meta>>68)&MASK48);f.expectedRevision=uint32(meta>>116);
                if(f.bindingOrdinal==0)revert E_REPLAY_SOURCE();
                bytes32 position=at(source,root(f.bindingOrdinal,9),0);
                bytes32 posBase=keccak256(abi.encode(position,uint256(10)));
                bytes32 purpose=at(source,posBase,0);bytes32 subject=at(source,posBase,1);
                if(purpose==0||position!=Keys.position(purpose,subject,at(source,posBase,2)))revert E_REPLAY_SOURCE();
                f.scopeKey=Keys.scope(author,purpose,subject);f.bindingKey=Keys.binding(author,position);
                if(f.kind==3){
                    f.recordId=a;uint64 admitted;(f.typeId,admitted,)=IndexSource.header(source,a);
                    if(f.typeId==0)admitted=uint64(uint256(at(source,keccak256(abi.encode(a,uint256(4))),0)));
                    if(a==0||admitted==0||admitted>f.admission)revert E_REPLAY_SOURCE();
                }
            }else if(f.kind==5){
                bytes32 creator=(ev>>236)&1==0?author:at(source,root(p,12),6);
                if(creator==0)revert E_REPLAY_SOURCE();
                f.recordId=Keys.subject(creator,a);
                if(uint256(at(source,keccak256(abi.encode(f.recordId,uint256(4))),0))!=f.admission)revert E_REPLAY_SOURCE();
            }else{
                uint256 target=uint256(a);
                if(target==0||target>=f.admission)revert E_REPLAY_SOURCE();
                f.withdrawalTarget=uint64(target);bytes32 prior=root(target,5);uint256 pm=uint256(at(source,prior,0));
                (f.recordId,f.typeId)=recordFact(source,pm,at(source,prior,1),at(source,prior,2),uint64(target));
                f.author=principal(source,uint64((pm>>20)&MASK48));
                if(f.author!=author)revert E_REPLAY_SOURCE();
            }
            facts[i]=f;
        }
    }
}

/// Fixed constructor-created read-only decoder, source/code/layout pinned.
/// At most64 facts,10 fixed words each: ABI return64+64*320=20,544 bytes.
/// No bodies, effects, heads, coverage or caller-supplied source are accepted.
contract IndexReplayDecoder {
    address public immutable source;
    bytes32 public immutable sourceCodehash;
    constructor(address source_){
        source=source_;sourceCodehash=source_.codehash;
        if(IReplayLedger(source_).layoutId()!=IndexReplaySource.LAYOUT)revert IndexReplaySource.E_REPLAY_SOURCE();
    }
    function publication(uint64 p,uint64 first) external view returns(IndexReplaySource.Fact[] memory){
        if(source.codehash!=sourceCodehash||IReplayLedger(source).layoutId()!=IndexReplaySource.LAYOUT
            ||IIndexSource(source).extsload(ExecutionSlots.PUBLICATION_ACTIVE)!=0)revert IndexReplaySource.E_REPLAY_SOURCE();
        return IndexReplaySource.publication(source,p,first);
    }
}
