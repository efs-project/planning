// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {IAcceptor} from "../src/Interfaces.sol";
import {ProfiledFilesIndex} from "./ProfiledFilesIndex.sol";
import {Ledger} from "../src/Ledger.sol";
import {TypeRegistry} from "../src/TypeRegistry.sol";
import {Keys} from "../src/Keys.sol";
import {FilesLayout} from "./FilesJoinedProfile.sol";
import {FilesFinalValidator} from "./FilesFinalValidator.sol";
import {IndexWork} from "../src/IndexWork.sol";

library LiveFilesLayout {
    bytes32 internal constant DESCRIPTOR = keccak256("lab/type/files-live-descriptor/1");
    bytes32 internal constant ROOT = keccak256("lab/type/files-live-root/1");
    bytes32 internal constant CHILD = keccak256("lab/type/files-live-child/1");
    bytes32 internal constant VENUE = keccak256("evm/cancun/staticcall/1");
    bytes4 internal constant SELECTOR = bytes4(keccak256("quote(bytes32)"));
    struct Recipe {
        uint256 version; uint256 chainId; bytes32 venue; address provider;
        bytes32 providerHash; bytes4 selector; bytes32 key; bytes32 outputType;
        uint256 representation; uint256 callGas; uint256 maxReturn; address caller;
    }
    /// Directed matrix for a NEW live child only. Existing old child rules and
    /// their exact Type identities keep their original, narrower parent domain.
    function parentPrefix(bytes32 t,bytes32[5] memory p,bytes32 child) internal pure returns(uint256 prefix,bool exact){
        if(t==p[0])return (1,false);
        if(t==p[1])return (2,false);
        if(t==p[2]||t==p[4])return (2,true);
        if(t==p[3]||t==child)return (3,true);
    }
    function sameFile(Ledger core,bytes32 id,bytes32 file,bytes32[5] memory p,bytes32 child,uint64 before_) internal view returns(bool){
        (bytes32 t,uint64 first,uint32 length)=FilesLayout.header(core,id);
        (uint256 prefix,bool exact)=parentPrefix(t,p,child);
        return prefix!=0&&first!=0&&first<before_&&length>=prefix*32&&length<=8192
            &&(!exact||length==prefix*32)&&FilesLayout.word(core,id,prefix-1)==file;
    }
}
contract LiveFilesDescriptorRule is IAcceptor {
    address public immutable adapter; bytes32 public immutable outputType;
    bytes32 public immutable expectedProviderRuntimeHash;
    constructor(address a,bytes32 t,bytes32 providerHash){
        require(providerHash!=0);adapter=a;outputType=t;expectedProviderRuntimeHash=providerHash;
    }
    function accept(bytes32,bytes calldata data,bytes32[] calldata refs) external view returns(bool){
        if(data.length!=384||refs.length!=0)return false;
        LiveFilesLayout.Recipe memory r=abi.decode(data,(LiveFilesLayout.Recipe));
        // abi.decode checks address/selector padding; no provider call occurs.
        return r.version==1&&r.chainId==block.chainid&&r.venue==LiveFilesLayout.VENUE
            &&r.providerHash==expectedProviderRuntimeHash&&r.provider.code.length!=0&&r.provider.codehash==r.providerHash
            &&r.selector==LiveFilesLayout.SELECTOR&&r.outputType==outputType&&outputType!=0
            &&r.representation==1&&r.callGas==50000&&r.maxReturn==64&&r.caller==adapter&&adapter.code.length!=0;
    }
}
contract LiveFilesRootRule is IAcceptor {
    function accept(bytes32,bytes calldata data,bytes32[] calldata refs) external view returns(bool){
        return data.length==64&&refs.length==1&&bytes32(data[:32])==refs[0]
            &&bytes32(data[32:64])!=0&&Ledger(msg.sender).subjectCreatedAt(bytes32(data[32:64]))!=0;
    }
}
contract LiveFilesChildRule is IAcceptor {
    bytes32 private immutable p0;bytes32 private immutable p1;bytes32 private immutable p2;
    bytes32 private immutable p3;bytes32 private immutable p4;
    constructor(bytes32[5] memory p){p0=p[0];p1=p[1];p2=p[2];p3=p[3];p4=p[4];}
    function parents(uint256 i) external view returns(bytes32){require(i<5);return [p0,p1,p2,p3,p4][i];}
    function accept(bytes32 incoming,bytes calldata data,bytes32[] calldata refs) external view returns(bool){
        if(data.length!=96||refs.length!=2||bytes32(data[:32])!=refs[0]||bytes32(data[32:64])!=refs[1])return false;
        Ledger core=Ledger(msg.sender);bytes32 file=bytes32(data[64:96]);
        if(file==0||core.subjectCreatedAt(file)==0)return false;
        return LiveFilesLayout.sameFile(core,refs[0],file,[p0,p1,p2,p3,p4],incoming,type(uint64).max);
    }
}
contract LiveFilesIndex is ProfiledFilesIndex {
    bytes32[3] public liveTypes;
    bytes32[3] public liveRuleHashes;
    FilesFinalValidator public immutable finalValidator;
    bytes32 public immutable finalValidatorHash;
    error E_LIVE_PROFILE();
    constructor(address c,bytes32[8] memory legacy,bytes32[5] memory ts,bytes32[5] memory hs,bytes32[3] memory lt,bytes32[3] memory lh,
        FilesFinalValidator helper,bytes32 expectedHelperHash)
        ProfiledFilesIndex(c,legacy,ts,hs){
        TypeRegistry registry=TypeRegistry(address(Ledger(c).registry()));
        bytes32[3] memory shapes=[LiveFilesLayout.DESCRIPTOR,LiveFilesLayout.ROOT,LiveFilesLayout.CHILD];
        address child;
        for(uint256 i;i<3;i++){
            (bytes32 shape,bytes32 hash,address rule,uint8 count,,)=registry.descriptor(lt[i]);
            bytes32[] memory refs=registry.refTypes(lt[i]);
            if(lt[i]==0||lh[i]==0||shape!=shapes[i]||hash!=lh[i]||rule.codehash!=hash
                ||count!=i||refs.length!=i||Keys.typeId(shape,refs,hash)!=lt[i])revert E_LIVE_PROFILE();
            if((i==1&&refs[0]!=lt[0])||(i==2&&(refs[0]!=0||refs[1]!=lt[0])))revert E_LIVE_PROFILE();
            if(i==0&&(LiveFilesDescriptorRule(rule).adapter().code.length==0||LiveFilesDescriptorRule(rule).outputType()==0))revert E_LIVE_PROFILE();
            if(i==2)child=rule;
        }
        bytes32[5] memory parents=[legacy[0],legacy[1],ts[2],ts[3],lt[1]];
        for(uint256 i;i<5;i++)if(LiveFilesChildRule(child).parents(i)!=parents[i])revert E_LIVE_PROFILE();
        liveTypes=lt;liveRuleHashes=lh;
        // expectedHelperHash is an independently reviewed deployment pin, not
        // self-certification by these getters. The measurement fixture verifies
        // artifact template, immutable constructor patches and dependency closure.
        if(address(helper).code.length==0||expectedHelperHash==0||address(helper).codehash!=expectedHelperHash
            ||address(helper.ledger())!=c||helper.nameType()!=legacy[4]||helper.nameHash()!=legacy[5]
            ||helper.directoryType()!=legacy[6]||helper.directoryHash()!=legacy[7])revert E_LIVE_PROFILE();
        finalValidator=helper;finalValidatorHash=expectedHelperHash;
    }
    function _manifestExtension() internal view override returns(bytes32){
        return keccak256(abi.encode(super._manifestExtension(),"LiveFiles/1:quote-uint128-bool:shape-only:directed-parent-matrix",liveTypes,liveRuleHashes));
    }
    // The existing generic checked-reference fold indexes live parent/descriptor
    // edges once, including replay. No old rule source/identity is changed.
    function _validatePublication(Effect[] memory effects) internal view override {
        // The inherited final seam contains exactly the extracted Name and
        // Directory unit; generic fold, replay and publication authentication
        // remain untouched. No provider is invoked here.
        address helper=address(finalValidator);
        if(helper.codehash!=finalValidatorHash)revert E_LIVE_PROFILE();
        bytes memory input=abi.encodeCall(finalValidator.validate,(effects));
        uint256 cap=IndexWork.MAXIMUM;
        bool ok;uint256 size;bytes32 value;
        assembly("memory-safe"){
            let out:=mload(0x40)
            ok:=staticcall(cap,helper,add(input,32),mload(input),out,32)
            size:=returndatasize()
            value:=mload(out)
        }
        if(!ok||size!=32||value!=bytes32(bytes4(keccak256("FilesFinalValidator/1/valid"))))revert E_LIVE_PROFILE();
    }
}
