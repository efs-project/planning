// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {Keys} from "./Keys.sol";
import {IAcceptor} from "./Interfaces.sol";

/// Disposable finite codec, not a permanent EFS schema language. Packed,
/// big-endian grammar and literal vectors live in core-closeout-types-20260915.
library DescribedCodec {
    bytes32 internal constant SHAPE_DOMAIN=keccak256("efs.lab.described-shape/1");
    bytes32 internal constant PROFILE=keccak256("efs.lab.described-wrapper/1");
    uint256 internal constant HEADER=90;
    uint256 internal constant FIELD=164;
    struct Schema {address key;bytes32 namespace;bytes32 customHash;uint8 customAbi;uint8 count;uint256 start;bytes32[] refs;}
    error E_DESCRIPTOR();
    error E_VERSION();
    error E_BODY();

    function word(bytes memory b,uint256 p) internal pure returns(bytes32 v){
        assembly("memory-safe"){v:=mload(add(add(b,32),p))}
    }
    function u16(bytes memory b,uint256 p) internal pure returns(uint256){return uint256(word(b,p))>>240;}
    function shape(bytes memory d) internal pure returns(bytes32){return keccak256(abi.encode(SHAPE_DOMAIN,d));}

    function parse(bytes memory d) internal pure returns(Schema memory s){
        if(d.length<HEADER||d.length>4096)revert E_DESCRIPTOR();
        if(uint8(d[0])!=1||uint8(d[1])!=1)revert E_VERSION();
        s.customAbi=uint8(d[2]);s.count=uint8(d[3]);
        s.key=address(uint160(uint256(word(d,4))>>96));s.namespace=word(d,24);s.customHash=word(d,56);
        if(s.key==address(0)||s.namespace==0||s.count>16)revert E_DESCRIPTOR();
        if((s.customHash==0&&s.customAbi!=0)||(s.customHash!=0&&s.customAbi!=1))revert E_VERSION();
        uint256 descriptionLength=u16(d,88);
        s.start=HEADER+descriptionLength;
        if(descriptionLength==0||s.start+uint256(s.count)*FIELD!=d.length)revert E_DESCRIPTOR();
        s.refs=new bytes32[](8);uint256 n;
        for(uint256 i;i<s.count;i++){
            uint256 p=s.start+i*FIELD;bytes32 id=word(d,p);
            if(id==0||word(d,p+32)==0)revert E_DESCRIPTOR();
            for(uint256 j;j<i;j++)if(word(d,s.start+j*FIELD)==id)revert E_DESCRIPTOR();
            uint8 kind=uint8(d[p+64]);uint8 flags=uint8(d[p+65]);uint256 width=u16(d,p+66);
            uint256 lo=uint256(word(d,p+68));uint256 hi=uint256(word(d,p+100));bytes32 ref=word(d,p+132);
            if(flags>1||kind<1||kind>8||lo>hi)revert E_DESCRIPTOR();
            if(kind==1){
                // Required references only: no nullable word or inline presence.
                if(i!=n||n==8||flags!=0||width!=32||lo!=0||hi!=0||ref==0)revert E_DESCRIPTOR();
                s.refs[n++]=ref;
            }else{
                if(ref!=0)revert E_DESCRIPTOR();
                if(kind==2){if(width!=32||lo!=0||hi!=0)revert E_DESCRIPTOR();}
                else if(kind==3){if(width==0||width>32||(width<32&&hi>>(width*8)!=0))revert E_DESCRIPTOR();}
                else if(kind==4){if(width!=1||lo!=0||hi!=1)revert E_DESCRIPTOR();}
                else if(kind==5){if(width!=1||hi>255)revert E_DESCRIPTOR();}
                else if(width!=0||hi>8192)revert E_DESCRIPTOR();
            }
        }
        bytes32[] memory refs=s.refs;assembly("memory-safe"){mstore(refs,n)}
    }

    function validate(bytes memory d,Schema memory s,bytes calldata body,bytes32[] calldata refs) internal pure {
        if(body.length>8192||refs.length!=s.refs.length)revert E_BODY();
        uint256 cursor;
        for(uint256 i;i<s.count;i++){
            uint256 p=s.start+i*FIELD;uint8 kind=uint8(d[p+64]);
            if(uint8(d[p+65])==1){
                if(cursor==body.length)revert E_BODY();uint8 present=uint8(body[cursor++]);
                if(present==0)continue;if(present!=1)revert E_BODY();
            }
            uint256 length=u16(d,p+66);
            uint256 lo=uint256(word(d,p+68));uint256 hi=uint256(word(d,p+100));
            if(kind>=6){
                if(cursor+2>body.length)revert E_BODY();
                length=uint256(uint8(body[cursor]))*256+uint8(body[cursor+1]);cursor+=2;
                if(length<lo||length>hi)revert E_BODY();
            }
            if(cursor+length>body.length)revert E_BODY();
            uint256 value;assembly("memory-safe"){value:=calldataload(add(body.offset,cursor))}
            if(kind==1){if(bytes32(value)!=refs[i])revert E_BODY();}
            else if(kind>=3&&kind<=5){value>>=(32-length)*8;if(value<lo||value>hi)revert E_BODY();}
            else if(kind>=7){
                // Exact Note domain. Assembly avoids a second expensive Solidity
                // checked-index loop; range above covers every byte loaded.
                bool valid=true;
                assembly("memory-safe"){
                    let end:=add(add(body.offset,cursor),length)
                    for {let q:=add(body.offset,cursor)} lt(q,end) {q:=add(q,1)} {
                        let c:=byte(0,calldataload(q))
                        if and(or(lt(c,32),gt(c,126)),iszero(and(eq(kind,7),eq(c,10)))) {valid:=0 break}
                    }
                }
                if(!valid)revert E_BODY();
            }
            cursor+=length;
        }
        if(cursor!=body.length)revert E_BODY();
    }
}

/// STOP-prefixed immutable preimage. No executable schema or external URL.
contract DescriptorCode {
    constructor(bytes memory descriptor){
        bytes memory runtime=bytes.concat(hex"00",descriptor);
        assembly("memory-safe"){return(add(runtime,32),mload(runtime))}
    }
}

interface IDescribedPredicate {
    function acceptDescribed(address ledger,bytes32 typeId,bytes calldata data,bytes32[] calldata refs) external view returns(bool);
}
interface IDescribedRegistry {
    struct Info {address blob;address mandatory;bytes32 shape;bytes32 rule;address custom;address allowedLedger;bytes32 bindingId;}
    function describedInfo(bytes32 typeId) external view returns(Info memory);
}

/// Fixed reviewed mandatory wrapper. NO storage, immutables, constructor
/// parameters, arbitrary forwarding or delegatecall. Caller context is captured
/// here, never supplied by an admission's author or a public forwarding method.
contract DescribedTypeRule is IAcceptor {
    error E_CONTEXT();
    function accept(bytes32 typeId,bytes calldata data,bytes32[] calldata refs) external view returns(bool){
        if(data.length>8192||refs.length>8)revert E_CONTEXT();
        bytes memory got=_fixed(msg.sender,abi.encodeWithSignature("registry()"),32,15_000);
        uint256 registryWord=uint256(bytes32(got));
        if(registryWord==0||registryWord>type(uint160).max)revert E_CONTEXT();
        address registry=address(uint160(registryWord));
        IDescribedRegistry.Info memory info=abi.decode(_fixed(registry,abi.encodeCall(IDescribedRegistry.describedInfo,(typeId)),224,35_000),(IDescribedRegistry.Info));
        if(info.mandatory!=address(this)||info.rule!=address(this).codehash)revert E_CONTEXT();
        uint256 size=info.blob.code.length;if(size<91||size>4097)revert E_CONTEXT();
        bytes memory d=new bytes(size-1);address blob=info.blob;uint256 first;
        assembly("memory-safe"){
            extcodecopy(blob,0,0,1) first:=byte(0,mload(0))
            extcodecopy(blob,add(d,32),1,sub(size,1))
        }
        if(first!=0||DescribedCodec.shape(d)!=info.shape)revert E_CONTEXT();
        DescribedCodec.Schema memory s=DescribedCodec.parse(d);
        if(Keys.typeId(info.shape,s.refs,info.rule)!=typeId)revert E_CONTEXT();
        // The registry's actual leading reference projection must match too.
        bytes memory expected=_fixed(registry,abi.encodeWithSignature("refTypes(bytes32)",typeId),64+32*s.refs.length,30_000);
        if(keccak256(expected)!=keccak256(abi.encode(s.refs)))revert E_CONTEXT();
        DescribedCodec.validate(d,s,data,refs);
        if(s.customHash==0){
            if(info.custom!=address(0)||info.allowedLedger!=address(0)||info.bindingId!=0)revert E_CONTEXT();
            return true;
        }
        if(info.bindingId==0||info.custom.code.length==0||info.custom.codehash!=s.customHash||info.allowedLedger!=msg.sender)revert E_CONTEXT();
        bytes memory input=abi.encodeCall(IDescribedPredicate.acceptDescribed,(msg.sender,typeId,data,refs));
        uint256 remaining=gasleft();if(remaining<=12_000)return false;
        // A nested allowance, not another300k. EIP150 may reduce it further.
        uint256 budget=(remaining-12_000)*63/64;bool ok;uint256 returned;uint256 answer;address custom=info.custom;
        assembly("memory-safe"){
            let ptr:=mload(0x40)
            ok:=staticcall(budget,custom,add(input,32),mload(input),ptr,32)
            returned:=returndatasize() answer:=mload(ptr)
        }
        return ok&&returned==32&&answer==1;
    }
    function _fixed(address target,bytes memory input,uint256 size,uint256 gasLimit) private view returns(bytes memory output){
        output=new bytes(size);bool ok;uint256 returned;
        assembly("memory-safe"){
            ok:=staticcall(gasLimit,target,add(input,32),mload(input),add(output,32),size)
            returned:=returndatasize()
        }
        if(!ok||returned!=size)revert E_CONTEXT();
    }
}
