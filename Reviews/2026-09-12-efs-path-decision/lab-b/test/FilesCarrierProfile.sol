// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {IAcceptor} from "../src/Interfaces.sol";
import {Ledger} from "../src/Ledger.sol";
import {FilesLayout} from "./FilesJoinedProfile.sol";
import {FilesDirectoryIndex} from "./FilesDirectoryProfile.sol";
import {TypeRegistry} from "../src/TypeRegistry.sol";
import {Keys} from "../src/Keys.sol";
/// Every descriptor has one exact Bytes reference. External descriptors use the
/// canonical empty Bytes Record as a sentinel, never an arbitrary URI/DAG hash.
/// Body: [bytesRef,version,carrier,hashAlg,length,sha256,media,cipher,nonce12,
///        plaintextLength,plaintextSHA256OrZero]. Encrypted digest MUST be zero
/// in this v2 profile: no public plaintext fingerprint. Scalars are 32-byte words;
/// nonce is left-aligned with 20 zero padding bytes. Maximum stored bytes 1 MiB.
contract FilesBytesRule is IAcceptor {
    // Hash the supplied calldata ONCE; descriptor joins later need only header
    // length and this retained commitment word, not cold full-body rehashing.
    function accept(bytes32,bytes calldata data,bytes32[] calldata refs) external pure returns(bool){
        return data.length>=32&&data.length<=8192&&refs.length==0&&bytes32(data[:32])==sha256(data[32:]);
    }
}
contract FilesContentRule is IAcceptor {
    bytes32 public immutable bytesType;
    constructor(bytes32 b){bytesType=b;}
    function accept(bytes32,bytes calldata data,bytes32[] calldata refs) external view returns(bool){
        if(data.length!=352||refs.length!=1||bytes32(data[:32])!=refs[0])return false;
        uint256 version=uint256(bytes32(data[32:64]));uint256 carrier=uint256(bytes32(data[64:96]));
        uint256 algorithm=uint256(bytes32(data[96:128]));uint256 length=uint256(bytes32(data[128:160]));bytes32 hash=bytes32(data[160:192]);
        uint256 media=uint256(bytes32(data[192:224]));uint256 cipher=uint256(bytes32(data[224:256]));bytes32 nonce=bytes32(data[256:288]);
        uint256 plainLength=uint256(bytes32(data[288:320]));bytes32 plainHash=bytes32(data[320:352]);
        if(version!=1||carrier>1||algorithm!=1||media>2||cipher>1||length>1048576||plainLength>1048576||uint160(uint256(nonce))!=0)return false;
        if(cipher==0){if(nonce!=0||plainLength!=length||plainHash!=hash)return false;}
        else if(length!=plainLength+16||plainHash!=0)return false;
        (bytes32 t,uint64 first,uint32 size)=FilesLayout.header(Ledger(msg.sender),refs[0]);
        if(t!=bytesType||first==0||size<32||size>8192)return false;
        bytes32 retainedHash=FilesLayout.word(Ledger(msg.sender),refs[0],0);
        if(carrier==1)return size==32&&retainedHash==sha256(""); // remote bytes are explicitly NOT validated by admission.
        return size-32==length&&retainedHash==hash;
    }
}
contract FilesCarrierRootRule is IAcceptor {
    function accept(bytes32,bytes calldata data,bytes32[] calldata refs) external view returns(bool){
        if(data.length!=64||refs.length!=1||bytes32(data[:32])!=refs[0])return false;
        bytes32 file=bytes32(data[32:64]);return file!=0&&Ledger(msg.sender).subjectCreatedAt(file)!=0;
    }
}
contract FilesCarrierChildRule is IAcceptor {
    bytes32 public immutable inlineRoot;bytes32 public immutable inlineChild;bytes32 public immutable carrierRoot;
    constructor(bytes32 r,bytes32 c,bytes32 cr){inlineRoot=r;inlineChild=c;carrierRoot=cr;}
    function accept(bytes32 incoming,bytes calldata data,bytes32[] calldata refs) external view returns(bool){
        if(data.length!=96||refs.length!=2||bytes32(data[:32])!=refs[0]||bytes32(data[32:64])!=refs[1])return false;
        bytes32 file=bytes32(data[64:96]);Ledger core=Ledger(msg.sender);
        if(file==0||core.subjectCreatedAt(file)==0)return false;
        (bytes32 t,uint64 first,uint32 length)=FilesLayout.header(core,refs[0]);if(first==0)return false;
        if(t==inlineRoot)return length>=32&&FilesLayout.word(core,refs[0],0)==file;
        if(t==inlineChild)return length>=64&&FilesLayout.word(core,refs[0],1)==file;
        if(t==carrierRoot)return length==64&&FilesLayout.word(core,refs[0],1)==file;
        if(t==incoming)return length==96&&FilesLayout.word(core,refs[0],2)==file;
        return false;
    }
}
contract FilesConceptRule is IAcceptor {
    /// Untrusted namespace + printable ASCII label, not universal concept authority.
    function accept(bytes32,bytes calldata data,bytes32[] calldata refs) external pure returns(bool){
        if(data.length<33||data.length>160||refs.length!=0||bytes32(data[:32])==0)return false;
        for(uint256 i=32;i<data.length;i++)if(uint8(data[i])<32||uint8(data[i])>126)return false;return true;
    }
}

/// Composes the accepted Directory/Names index; Core layout and old Type
/// offsets remain unchanged. Adds carrier-child reverse-parent postings.
contract FilesCarrierIndex is FilesDirectoryIndex {
    bytes32[5] public carrierTypes;
    bytes32[5] public carrierRuleHashes;
    error E_CARRIER_PROFILE();
    function _manifestExtension() internal view virtual override returns(bytes32){
        return keccak256(abi.encode(super._manifestExtension(),"FilesCarrier/2:ciphertext-only",carrierTypes,carrierRuleHashes));
    }
    constructor(address c,bytes32[8] memory legacy,bytes32[5] memory ts,bytes32[5] memory hs)
        FilesDirectoryIndex(c,legacy[0],legacy[1],legacy[2],legacy[3],legacy[4],legacy[5],legacy[6],legacy[7]) {
        string[5] memory shapes=["lab/type/files-bytes/1","lab/type/files-content/1","lab/type/files-carrier-root/1","lab/type/files-carrier-child/1","lab/type/files-concept/1"];
        TypeRegistry registry=TypeRegistry(address(Ledger(c).registry()));address[5] memory rules;
        for(uint256 i;i<5;i++){
            (bytes32 shape,bytes32 h,address rule,uint8 count,,)=registry.descriptor(ts[i]);bytes32[] memory refs=registry.refTypes(ts[i]);
            uint256 expected=i==1||i==2?1:i==3?2:0;
            if(ts[i]==0||hs[i]==0||shape!=keccak256(bytes(shapes[i]))||h!=hs[i]||rule.codehash!=h||count!=expected||refs.length!=expected
                ||Keys.typeId(shape,refs,h)!=ts[i])revert E_CARRIER_PROFILE();
            if((i==1&&refs[0]!=ts[0])||(i==2&&refs[0]!=ts[1])||(i==3&&(refs[0]!=0||refs[1]!=ts[1])))revert E_CARRIER_PROFILE();
            rules[i]=rule;
        }
        if(FilesContentRule(rules[1]).bytesType()!=ts[0]||FilesCarrierChildRule(rules[3]).inlineRoot()!=legacy[0]
            ||FilesCarrierChildRule(rules[3]).inlineChild()!=legacy[1]||FilesCarrierChildRule(rules[3]).carrierRoot()!=ts[2])revert E_CARRIER_PROFILE();
        carrierTypes=ts;carrierRuleHashes=hs;
    }
    function _foldEffect(Effect memory e) internal virtual override {
        super._foldEffect(e);
            if((e.kind!=1&&e.kind!=2)||e.typeId!=carrierTypes[3])return;
            (bytes32 t,uint64 first,uint32 length)=FilesLayout.header(Ledger(ledger),e.recordId);
            if(t!=carrierTypes[3]||length!=96||first==0||first>e.admission)revert E_CARRIER_PROFILE();
    }
}
