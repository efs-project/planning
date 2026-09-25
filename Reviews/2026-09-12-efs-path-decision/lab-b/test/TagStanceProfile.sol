// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {Ledger} from "../src/Ledger.sol";
import {TypeRegistry} from "../src/TypeRegistry.sol";
import {Keys} from "../src/Keys.sol";
import {IIndexModule} from "../src/Interfaces.sol";
import {IndexWork} from "../src/IndexWork.sol";
import {DescribedCodec} from "../src/DescribedTypeProfile.sol";
import {FilesLayout} from "./FilesJoinedProfile.sol";
import {FilesDirectoryLayout} from "./FilesDirectoryProfile.sol";
import {FilesNameLayout} from "./FilesNamesProfile.sol";
import {FilesFinalValidator} from "./FilesFinalValidator.sol";
import {LiveFilesIndex} from "./LiveFilesProfile.sol";

/// Disposable explicit profile, not an interpretation of legacy TAG. The one
/// retained descriptor uses the existing described-Type codec, never a new DSL.
library TagStanceProfile {
    bytes32 internal constant PURPOSE=keccak256("efs.lab/tag-stance/1");
    bytes32 internal constant FAMILY=keccak256("efs.lab/tag-role-inventory/1");
    bytes32 internal constant VERSION=keccak256("TagStance/2:exact-placement-file-revision:own-cutoff:retained:unbind-silent");
    struct Config {
        bytes32 tokenType;bytes32 tokenRuleHash;bytes tokenDescriptor;
        bytes32 conceptType;bytes32 conceptHash;bytes32 directoryType;bytes32 directoryHash;
        bytes32 nameType;bytes32 nameHash;
        // inline root/child, stored root/child, live root/child; never future Types.
        bytes32[6] revisions;bytes32[6] revisionHashes;
    }
    error E_TAG_PROFILE();
    function descriptor(address declarer) internal pure returns(bytes memory){
        bytes memory label=bytes("TagStanceToken/1:1=ASSERT;2=DENY;3=SILENT");
        return abi.encodePacked(hex"01010001",declarer,PURPOSE,bytes32(0),uint16(label.length),label,
            bytes32(uint256(1)),keccak256("stance-word"),uint8(3),uint8(0),uint16(32),uint256(0),type(uint256).max,bytes32(0));
    }
    function token(bytes32 t,uint256 value) internal pure returns(bytes32){return Keys.record(t,abi.encode(value));}
    function inventory(bytes32 principal,bytes32 concept_) internal pure returns(bytes32){return keccak256(abi.encode(FAMILY,principal,PURPOSE,concept_));}
    function pin(Ledger core,Config memory c) internal view {
        TypeRegistry registry=TypeRegistry(address(core.registry()));
        FilesNameLayout.pin(core,c.nameType,c.nameHash);
        DescribedCodec.Schema memory schema=DescribedCodec.parse(c.tokenDescriptor);
        if(keccak256(c.tokenDescriptor)!=keccak256(descriptor(schema.key))
            ||keccak256(registry.descriptorBytes(c.tokenType))!=keccak256(c.tokenDescriptor))revert E_TAG_PROFILE();
        (bytes32 shape,bytes32 hash,address rule,uint8 count,,)=registry.descriptor(c.tokenType);
        if(shape!=DescribedCodec.shape(c.tokenDescriptor)||hash==0||hash!=c.tokenRuleHash||rule.codehash!=hash||count!=0
            ||Keys.typeId(shape,new bytes32[](0),hash)!=c.tokenType)revert E_TAG_PROFILE();
    }
    function profile(Config memory c) internal pure returns(bytes memory){
        // Exact semantic preimage includes retained descriptor bytes, token
        // words/IDs, offsets/widths and each child's directed parent bit mask.
        // Masks: inline child3, carrier child15, live child63.
        return abi.encode(VERSION,PURPOSE,FAMILY,c,[token(c.tokenType,1),token(c.tokenType,2),token(c.tokenType,3)],
            [uint256(1),uint256(2),uint256(3)],[uint8(0),1,1,2,1,2],[uint16(0),0,64,96,64,96],[uint8(0),3,0,15,0,63]);
    }
    function validate(Ledger core,Config memory c,IIndexModule.Effect memory e) internal view returns(bytes32 key){
        if(e.kind!=3&&e.kind!=4&&e.kind!=7)return 0;
        bytes32 position=core.bindingPosition(e.bindingOrdinal);
        (bytes32 purpose,bytes32 subject,bytes32 concept_)=core.positionCell(position);
        // Authenticate the recovered coordinate even before purpose dispatch.
        // This also prevents a corrupt purpose from bypassing new UNBIND checks.
        if(position!=Keys.position(purpose,subject,concept_)||e.bindingKey!=Keys.binding(e.author,position)
            ||e.scopeKey!=Keys.scope(e.author,purpose,subject))revert E_TAG_PROFILE();
        if(purpose!=PURPOSE)return 0;
        // Stance already distinguishes ASSERT/DENY/SILENT. Release is not
        // adopted by this specialized profile; fail the whole publication.
        if(e.kind==7)revert E_TAG_PROFILE();
        if(e.admission==0)revert E_TAG_PROFILE();
        uint64 cutoff=e.admission-1;
        _concept(core,c,concept_,cutoff);_subject(core,c,subject,cutoff);
        bytes32 target=e.kind==3?e.target:e.oldTarget;
        (bytes32 t,uint64 first,uint32 length)=FilesLayout.header(core,target);
        uint256 word=uint256(FilesLayout.word(core,target,0));
        if(t!=c.tokenType||first==0||first>cutoff||length!=32||word<1||word>3||token(t,word)!=target)revert E_TAG_PROFILE();
        return inventory(e.author,concept_);
    }
    function _concept(Ledger core,Config memory c,bytes32 id,uint64 cutoff) private view {
        (bytes32 t,uint64 first,uint32 length)=FilesLayout.header(core,id);
        if(t!=c.conceptType||first==0||first>cutoff||length<33||length>160)revert E_TAG_PROFILE();
        (,,,bytes memory body)=core.record(id);
        if(bytes32(body)==0||Keys.record(t,body)!=id)revert E_TAG_PROFILE();
        for(uint256 i=32;i<body.length;i++)if(uint8(body[i])<32||uint8(body[i])>126)revert E_TAG_PROFILE();
    }
    function _revision(Ledger core,Config memory c,bytes32 id,uint64 cutoff) private view returns(uint256 kind,bytes32 file,uint64 first){
        (bytes32 t,uint64 admitted,uint32 length)=FilesLayout.header(core,id);first=admitted;
        if(first==0||first>cutoff||length>8192)revert E_TAG_PROFILE();
        for(kind=0;kind<6;kind++)if(t==c.revisions[kind])break;
        if(kind==6)revert E_TAG_PROFILE();
        uint256 offset=kind==0?0:kind==1||kind==2||kind==4?1:2;
        if(length<(offset+1)*32||(kind>=2&&length!=(offset+1)*32))revert E_TAG_PROFILE();
        file=FilesLayout.word(core,id,offset);uint64 created=core.subjectCreatedAt(file);
        if(file==0||created==0||created>=first)revert E_TAG_PROFILE();
    }
    function _subject(Ledger core,Config memory c,bytes32 id,uint64 cutoff) private view {
        uint64 created=core.subjectCreatedAt(id);if(created!=0&&created<=cutoff)return;
        (bytes32 t,,)=FilesLayout.header(core,id);
        if(t==c.directoryType){if(!FilesDirectoryLayout.validate(core,c.directoryType,id,cutoff))revert E_TAG_PROFILE();return;}
        // A location is the retained FOLDER coordinate, not its current File.
        // It can remain tagged after rebind/removal; an unobserved or forged
        // coordinate cannot be tagged. The Name and parent Directory must have
        // existed before this stance's admission, under exact pinned rules.
        (bytes32 purpose,bytes32 folder,bytes32 role)=core.positionCell(id);
        if(purpose==FilesNameLayout.FOLDER){
            if(id!=Keys.position(purpose,folder,role)||!FilesDirectoryLayout.validate(core,c.directoryType,folder,cutoff))revert E_TAG_PROFILE();
            bytes32 nameId=Keys.recordFromHash(c.nameType,role);
            (uint8 status,bytes32 actualNameType,uint64 nameFirst,bytes memory value)=FilesNameLayout.load(address(core),nameId);
            if(status!=1||actualNameType!=c.nameType||nameFirst==0||nameFirst>cutoff||!FilesNameLayout.valid(value)
                ||keccak256(value)!=role)revert E_TAG_PROFILE();
            return;
        }
        (uint256 kind,bytes32 file,uint64 first)=_revision(core,c,id,cutoff);
        if(kind%2==0)return;
        (uint256 parentKind,bytes32 parentFile,)=_revision(core,c,FilesLayout.word(core,id,0),first-1);
        if(parentFile!=file||(kind==1&&parentKind>1)||(kind==3&&parentKind>3))revert E_TAG_PROFILE();
    }
}

/// The complete fixed validation unit, extracted after the retained inline
/// candidate exceeded both ordinary byte limits. No writer/admin/delegatecall.
/// Codehash + constructor inputs are deployment trust inputs, not self-certification.
contract TagStanceValidator {
    TagStanceProfile.Config private _tag;
    Ledger public immutable ledger;
    bytes32 public immutable filesConfigurationHash;
    bytes public profileBytes;
    bytes32 public immutable profileHash;
    constructor(address c,bytes32[8] memory legacy,bytes32[5] memory ts,bytes32[5] memory hs,bytes32[3] memory lt,bytes32[3] memory lh,
        bytes32 tokenType,bytes32 tokenHash,bytes memory descriptor_){
        ledger=Ledger(c);filesConfigurationHash=keccak256(abi.encode(legacy,ts,hs,lt,lh));
        TagStanceProfile.Config memory config=TagStanceProfile.Config(tokenType,tokenHash,descriptor_,ts[4],hs[4],legacy[6],legacy[7],legacy[4],legacy[5],
            [legacy[0],legacy[1],ts[2],ts[3],lt[1],lt[2]],[legacy[2],legacy[3],hs[2],hs[3],lh[1],lh[2]]);
        TagStanceProfile.pin(Ledger(c),config);_tag=config;
        profileBytes=TagStanceProfile.profile(config);profileHash=keccak256(profileBytes);
    }
    function validate(IIndexModule.Effect calldata e) external view returns(bytes32){return TagStanceProfile.validate(ledger,_tag,e);}
}

/// Required from fresh genesis, or detached and fully replayed before checked
/// replacement. No new seen map, subject mirror, all-author list or Core opcode.
contract TagStanceIndex is LiveFilesIndex {
    TagStanceValidator public immutable stanceValidator;
    bytes32 public immutable stanceValidatorHash;
    bytes32 public immutable tagProfileHash;
    constructor(address c,bytes32[8] memory legacy,bytes32[5] memory ts,bytes32[5] memory hs,bytes32[3] memory lt,bytes32[3] memory lh,
        FilesFinalValidator helper,bytes32 helperHash,TagStanceValidator validator,bytes32 validatorHash)
        LiveFilesIndex(c,legacy,ts,hs,lt,lh,helper,helperHash){
        if(address(validator).code.length==0||validatorHash==0||address(validator).codehash!=validatorHash
            ||address(validator.ledger())!=c||validator.filesConfigurationHash()!=keccak256(abi.encode(legacy,ts,hs,lt,lh)))revert TagStanceProfile.E_TAG_PROFILE();
        stanceValidator=validator;stanceValidatorHash=validatorHash;tagProfileHash=validator.profileHash();
        _declare(TagStanceProfile.FAMILY,true,attachedFrom);
    }
    function _manifestExtension() internal view override returns(bytes32){return keccak256(abi.encode(super._manifestExtension(),tagProfileHash));}
    function _extensionEntry(bytes32 f) internal view override returns(ManifestEntry memory){
        if(f==TagStanceProfile.FAMILY)return ManifestEntry(f,0,3,2,keccak256("abi.encode(familyDomain,Principal,purpose,exactConcept):bindingOrdinal:iff-BIND-freshBinding"),true);
        return super._extensionEntry(f);
    }
    function _foldEffect(Effect memory e) internal override {
        bytes32 key;
        if(e.kind==3||e.kind==4||e.kind==7){
            address helper=address(stanceValidator);
            if(helper.codehash!=stanceValidatorHash)revert TagStanceProfile.E_TAG_PROFILE();
            bytes memory input=abi.encodeCall(stanceValidator.validate,(e));bool ok;uint256 size;
            uint256 cap=IndexWork.MAXIMUM;
            assembly("memory-safe"){
                let ptr:=mload(0x40)
                ok:=staticcall(cap,helper,add(input,32),mload(input),ptr,32)
                size:=returndatasize() key:=mload(ptr)
            }
            if(!ok||size!=32)revert TagStanceProfile.E_TAG_PROFILE();
        }
        super._foldEffect(e);
        if(key!=0&&e.kind==3&&e.freshBinding)_append(key,e.bindingOrdinal,true);
    }
}
