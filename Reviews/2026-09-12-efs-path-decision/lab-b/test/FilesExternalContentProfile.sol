// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {IAcceptor} from "../src/Interfaces.sol";
import {Ledger} from "../src/Ledger.sol";
import {FilesLayout} from "./FilesJoinedProfile.sol";
/// NEW exact Type rule, not a change to FilesContentRule or an existing Type.
/// v1 remains exactly 352 bytes. v2: ref32 | version1 | carrier1 | media1 |
/// zero61 | algorithmWord32 | lengthWord32 | sha256(bytes)32 | ASCII locator.
/// Existing generic scalar/digest field-index word offsets stay meaningful. The single
/// Bytes reference is the existing empty sentinel. No remote proof at admission.
contract FilesExternalContentRule is IAcceptor {
    bytes32 public immutable bytesType;
    constructor(bytes32 b){bytesType=b;}
    function accept(bytes32,bytes calldata data,bytes32[] calldata refs) external view returns(bool){
        if(data.length<32||refs.length!=1||bytes32(data[:32])!=refs[0])return false;
        if(data.length>192&&uint8(data[32])==2)return externalV2(data,refs[0]);
        return originalV1(data,refs[0]);
    }
    function emptySentinel(bytes32 ref) private view returns(bool){
        (bytes32 t,uint64 first,uint32 size)=FilesLayout.header(Ledger(msg.sender),ref);
        return t==bytesType&&first!=0&&size==32&&FilesLayout.word(Ledger(msg.sender),ref,0)==sha256("");
    }
    function externalV2(bytes calldata data,bytes32 ref) private view returns(bool){
        if(data.length>704||uint8(data[34])>2||uint256(bytes32(data[128:160]))>16777216
            ||bytes29(data[35:64])!=0||bytes32(data[64:96])!=0||uint256(bytes32(data[96:128]))!=1)return false;
        uint8 carrier=uint8(data[33]);bytes calldata uri=data[192:];
        if(carrier==2){
            if(uri.length!=48||bytes5(uri[:5])!=bytes5("ar://"))return false;
            for(uint256 i=5;i<48;i++){uint8 c=uint8(uri[i]);if(!alpha(c)&&!digit(c)&&c!=45&&c!=95)return false;}
        }else if(carrier==3){if(!ipfs(uri))return false;}else return false;
        return emptySentinel(ref);
    }
    function alpha(uint8 c) private pure returns(bool){return c>=65&&c<=90||c>=97&&c<=122;}
    function digit(uint8 c) private pure returns(bool){return c>=48&&c<=57;}
    function ipfs(bytes calldata uri) private pure returns(bool){
        if(uri.length<28||bytes7(uri[:7])!=bytes7("ipfs://"))return false;
        uint256 end=7;while(end<uri.length&&uri[end]!=0x2f)end++;
        if(uri[7]==0x51){
            if(end!=53||uri[8]!=0x6d)return false;
            for(uint256 i=9;i<end;i++){uint8 c=uint8(uri[i]);if(!(alpha(c)||c>=49&&c<=57)||c==73||c==79||c==108)return false;}
        }else{
            if(uri[7]!=0x62||end<28||end>128)return false;
            for(uint256 i=8;i<end;i++){uint8 c=uint8(uri[i]);if(!(c>=97&&c<=122||c>=50&&c<=55))return false;}
        }
        while(end<uri.length){
            uint256 start=++end;while(end<uri.length&&uri[end]!=0x2f){uint8 c=uint8(uri[end]);if(!alpha(c)&&!digit(c)&&c!=46&&c!=95&&c!=126&&c!=45)return false;end++;}
            if(end==start||end==start+1&&uri[start]==0x2e||end==start+2&&uri[start]==0x2e&&uri[start+1]==0x2e)return false;
        }
        return true;
    }
    /// Predicate intentionally copied byte-for-byte in meaning from the frozen
    /// lab v1 rule; inheritance cannot change its non-virtual external method.
    function originalV1(bytes calldata data,bytes32 ref) private view returns(bool){
        if(data.length!=352)return false;
        uint256 version=uint256(bytes32(data[32:64]));uint256 carrier=uint256(bytes32(data[64:96]));
        uint256 algorithm=uint256(bytes32(data[96:128]));uint256 length=uint256(bytes32(data[128:160]));bytes32 hash=bytes32(data[160:192]);
        uint256 media=uint256(bytes32(data[192:224]));uint256 cipher=uint256(bytes32(data[224:256]));bytes32 nonce=bytes32(data[256:288]);
        uint256 plainLength=uint256(bytes32(data[288:320]));bytes32 plainHash=bytes32(data[320:352]);
        if(version!=1||carrier>1||algorithm!=1||media>2||cipher>1||length>1048576||plainLength>1048576||uint160(uint256(nonce))!=0)return false;
        if(cipher==0){if(nonce!=0||plainLength!=length||plainHash!=hash)return false;}
        else if(length!=plainLength+16||plainHash!=0)return false;
        (bytes32 t,uint64 first,uint32 size)=FilesLayout.header(Ledger(msg.sender),ref);
        if(t!=bytesType||first==0||size<32||size>8192)return false;
        bytes32 retainedHash=FilesLayout.word(Ledger(msg.sender),ref,0);
        if(carrier==1)return size==32&&retainedHash==sha256("");
        return size-32==length&&retainedHash==hash;
    }
}
