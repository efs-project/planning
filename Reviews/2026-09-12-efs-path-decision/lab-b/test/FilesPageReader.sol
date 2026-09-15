// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {Ledger} from "../src/Ledger.sol";
import {LensReader} from "../src/LensReader.sol";
import {Keys} from "../src/Keys.sol";
import {FilesLayout} from "./FilesJoinedProfile.sol";
import {FilesNameLayout} from "./FilesNamesProfile.sol";
import {FilesDirectoryLayout} from "./FilesDirectoryProfile.sol";
import {FilesCarrierIndex} from "./FilesCarrierProfile.sol";

/// Disposable header projection, not a second Files selection engine. The
/// mandatory live Lens owns inventory/masking and all point/conflict selection.
/// A header authenticates retained admission/type/coordinates, NOT body bytes.
contract FilesPageReader {
    bytes32 private constant FOLDER=keccak256("efs2/purpose/folder/1");
    bytes32 private constant HEAD=keccak256("efs2/purpose/head/1");
    bytes32 private constant TAG=keccak256("efs2/purpose/tag/1");
    bytes32 private constant LAYOUT=keccak256("efs.lab.ledger-layout/2:roots-0-12-preserved:context-13:execution-14:readsets-15");
    struct Basis {uint64 admission;uint64 generation;uint64 epoch;bytes32 executionSet;}
    // tagScope: 0 no filter, 1 stable File/Directory, 2 selected revision, 3 either.
    struct Query {bytes32 concept;uint8 tagScope;bool diagnosticHead;string search;}
    struct Selected {uint8 status;bytes32 target;uint32 revision;bytes32 principalId;uint64 admission;}
    // Qualification: 0 UNKNOWN, 1 PRESENT, 2 NOT_APPLICABLE, 3 INVALID, 4 UNSUPPORTED.
    struct Name {uint8 qualification;bytes32 recordId;uint64 firstAdmission;bytes value;}
    struct Header {uint8 qualification;bytes32 recordId;bytes32 typeId;uint64 firstAdmission;uint32 bodyLength;bytes32 parent;bytes32 descriptor;}
    struct Tag {uint8 qualification;bytes32 subject;Selected selection;bool present;}
    struct Row {LensReader.PrincipalEntry placement;bytes32 role;Name name;uint8 kind;Selected head;Header header;Tag stableTag;Tag revisionTag;uint8 matchStatus;}
    // EXHAUSTED is suffix traversal, not authenticated prefix coverage. The
    // domain hash is not a MAC. Only an origin-started single call can prove
    // completeFromOrigin; SDK-owned chains may compose their own full coverage.
    struct Page {Row[] rows;uint8 scanStatus;bool startsAtOrigin;bool completeFromOrigin;uint64 scanned;uint64 hydrations;uint64 rawTotal;uint64 selectedSoFar;bytes continuation;}
    Ledger public immutable ledger;
    LensReader public immutable lens;
    FilesCarrierIndex public immutable index;
    bytes32 public immutable coreHash;
    bytes32 public immutable lensHash;
    bytes32 public immutable indexHash;
    error E_BASIS(); error E_QUERY(); error E_CONTINUATION();
    constructor(Ledger c,LensReader l,FilesCarrierIndex i){
        ledger=c;lens=l;index=i;coreHash=address(c).codehash;lensHash=address(l).codehash;indexHash=address(i).codehash;
        if(address(c).code.length==0||address(l).code.length==0||address(i).code.length==0)revert E_BASIS();
    }
    function readPage(bytes32 folder,bytes32[] calldata principals,Query calldata query,Basis calldata basis,bytes calldata continuation,uint256 budget)
        external view returns(Page memory page)
    {
        page.startsAtOrigin=continuation.length==0;
        (uint64 current,,,)=ledger.counts();
        if(basis.admission!=current||basis.generation!=index.generation()||basis.epoch!=ledger.registry().epoch()
            ||basis.executionSet!=ledger.executionSet()||ledger.layoutId()!=LAYOUT||ledger.indexModule()!=address(index)
            ||address(lens.ledger())!=address(ledger)||address(lens.index())!=address(index)||index.ledger()!=address(ledger)
            ||address(ledger).codehash!=coreHash||address(lens).codehash!=lensHash||address(index).codehash!=indexHash)revert E_BASIS();
        if(budget==0||budget>256||principals.length==0||principals.length>64||query.tagScope>3||bytes(query.search).length>255)revert E_QUERY();
        if(!FilesDirectoryLayout.validate(ledger,index.directoryType(),folder,current))revert E_QUERY();
        bytes32 queryHash=keccak256(abi.encode(msg.sender,address(this),folder,principals,query,basis));
        LensReader.PrincipalCursor memory cursor;
        if(continuation.length!=0){bytes32 previous;(previous,cursor)=abi.decode(continuation,(bytes32,LensReader.PrincipalCursor));if(previous!=queryHash)revert E_CONTINUATION();}
        (uint8 coverage,uint64 from,uint64 through)=index.coverage(index.FAMILY_LIVE_SCOPE(),keccak256(abi.encode(FOLDER,folder)));
        if(coverage!=2||from!=1||through!=current||index.attachedFrom()!=1)return page;
        FilesNameLayout.pin(ledger,index.nameType(),index.expectedNameRuleHash());
        LensReader.PrincipalPage memory source=lens.listPrincipals(principals,FOLDER,folder,cursor,budget);
        if(source.mutated)revert E_BASIS();
        page.scanStatus=source.status;page.scanned=source.scanned;page.hydrations=source.hydrations;
        page.rawTotal=source.rawTotal;page.selectedSoFar=source.selectedSoFar;page.rows=new Row[](source.items.length);
        page.completeFromOrigin=page.startsAtOrigin&&source.status==2&&source.scanned==source.rawTotal;
        uint256 n;
        for(uint256 k;k<source.items.length;k++){
            Row memory row;row.placement=source.items[k];
            (,,row.role)=ledger.positionCell(row.placement.position);
            row.name=_name(row.role,current);
            bytes32 target=row.placement.target;uint64 created=ledger.subjectCreatedAt(target);
            if(created!=0&&created<=current)row.kind=1;
            else if(FilesDirectoryLayout.validate(ledger,index.directoryType(),target,current))row.kind=2;
            else row.kind=4;
            if(row.kind==1){
                if(query.diagnosticHead){try lens.resolveNoTiebreakPrincipals(principals,HEAD,target,0,basis.executionSet) returns(uint8 status,LensReader.PrincipalEntry[] memory entries){row.head.status=status;
                    if(status==1){LensReader.PrincipalEntry memory item=entries[0];row.head=Selected(1,item.target,item.revision,item.principalId,item.admission);}}catch{row.head.status=4;}}
                else row.head=_selected(principals,HEAD,target,0,basis.executionSet);
                if(row.head.status==1){try this.readHeader(row.head.target,target,current) returns(Header memory h){row.header=h;}catch{row.header.recordId=row.head.target;}}
            }else if(row.kind==2){row.header.qualification=2;row.revisionTag.qualification=2;}
            if(query.concept!=0){
                row.stableTag=_tag(principals,target,target,query.concept,basis.executionSet);
                if(row.kind==1&&row.head.status==1)row.revisionTag=_tag(principals,row.head.target,target,query.concept,basis.executionSet);
            }
            row.matchStatus=_match(row,query);
            if(row.matchStatus!=2)page.rows[n++]=row; // unknown assessments remain visible
        }
        Row[] memory rows=page.rows;assembly("memory-safe"){mstore(rows,n)}
        if(page.scanStatus==1)page.continuation=abi.encode(queryHash,source.next);
    }
    function _name(bytes32 role,uint64 through) private view returns(Name memory result){
        result.recordId=Keys.recordFromHash(index.nameType(),role);
        (uint8 status,bytes32 t,uint64 first,bytes memory value)=FilesNameLayout.load(address(ledger),result.recordId);
        if(status==0)return result;
        if(t==0&&first==0)return result;
        result.firstAdmission=first;
        if(status!=1||t!=index.nameType()||first==0||first>through||!FilesNameLayout.valid(value)||keccak256(value)!=role){result.qualification=3;return result;}
        result.qualification=1;result.value=value;
    }
    function _selected(bytes32[] calldata principals,bytes32 p,bytes32 s,bytes32 r,bytes32 execution) private view returns(Selected memory selected){
        try lens.resolvePrincipals(principals,p,s,r,execution) returns(uint8 status,bytes32 target,uint32 revision,bytes32 author,uint64 at){selected=Selected(status,target,revision,author,at);}
        catch{selected.status=4;}
    }
    function _tag(bytes32[] calldata principals,bytes32 subject,bytes32 target,bytes32 concept,bytes32 execution) private view returns(Tag memory tag){
        tag.subject=subject;
        try lens.resolvePrincipals(principals,TAG,subject,concept,execution) returns(uint8 status,bytes32 value,uint32 revision,bytes32 author,uint64 at){
            tag.selection=Selected(status,value,revision,author,at);tag.qualification=1;tag.present=status==1&&value==target;
        }catch{}
    }
    function readHeader(bytes32 id,bytes32 file,uint64 through) external view returns(Header memory h){
        if(msg.sender!=address(this))revert E_QUERY(); // catchable helper, not an unguarded public reader
        h.recordId=id;(h.typeId,h.firstAdmission,h.bodyLength)=FilesLayout.header(ledger,id);
        if(h.firstAdmission==0)return h;
        uint256 prefix;bool child;bool carrier;
        if(h.typeId==index.rootType())prefix=1;
        else if(h.typeId==index.childType()){prefix=2;child=true;}
        else if(h.typeId==index.carrierTypes(2)){prefix=2;carrier=true;}
        else if(h.typeId==index.carrierTypes(3)){prefix=3;carrier=true;child=true;}
        else{h.qualification=4;return h;}
        if(h.firstAdmission>through||h.bodyLength<prefix*32||h.bodyLength>8192||(carrier&&h.bodyLength!=prefix*32)
            ||FilesLayout.word(ledger,id,prefix-1)!=file){h.qualification=3;return h;}
        (uint8 kind,,,,,,bytes32 bodyHash,bytes32 admittedType)=ledger.admission(h.firstAdmission);
        if(kind!=1||admittedType!=h.typeId||Keys.recordFromHash(admittedType,bodyHash)!=id){h.qualification=3;return h;}
        if(child){h.parent=FilesLayout.word(ledger,id,0);(bytes32 pt,uint64 first,uint32 length)=FilesLayout.header(ledger,h.parent);
            uint256 pp=pt==index.rootType()?1:pt==index.childType()?2:carrier&&pt==index.carrierTypes(2)?2:carrier&&pt==index.carrierTypes(3)?3:0;
            if(pp==0||first==0||first>=h.firstAdmission||length<pp*32||length>8192||FilesLayout.word(ledger,h.parent,pp-1)!=file){h.qualification=3;return h;}}
        if(carrier)h.descriptor=FilesLayout.word(ledger,id,prefix-2);
        h.qualification=1;
    }
    function _match(Row memory row,Query calldata query) private pure returns(uint8){
        if(row.kind==4||row.name.qualification!=1||row.head.status==3||row.head.status==4
            ||(row.head.status==1&&row.header.qualification!=1))return 0;
        // A requested unavailable join remains observable even when another
        // predicate is negative; it cannot manufacture a filtered empty proof.
        if(query.tagScope!=0){
            bool stable=query.tagScope==1||query.tagScope==3;bool revision=query.tagScope==2||query.tagScope==3;
            bool yes=(stable&&row.stableTag.present)||(revision&&row.revisionTag.present);
            bool known=(!stable||row.stableTag.qualification==1)&&(!revision||row.revisionTag.qualification==1||row.revisionTag.qualification==2);
            if(!yes&&!known)return 0;
        }
        bool unknown;
        bytes memory needle=bytes(query.search);
        if(needle.length!=0){if(row.name.qualification!=1)unknown=true;else{
            bool found;for(uint256 i;i+needle.length<=row.name.value.length;i++){bool same=true;for(uint256 j;j<needle.length;j++)if(row.name.value[i+j]!=needle[j]){same=false;break;}if(same){found=true;break;}}
            if(!found)return 2;}}
        if(query.tagScope!=0){
            bool stable=query.tagScope==1||query.tagScope==3;bool revision=query.tagScope==2||query.tagScope==3;
            bool yes=(stable&&row.stableTag.present)||(revision&&row.revisionTag.present);
            bool known=(!stable||row.stableTag.qualification==1)&&(!revision||row.revisionTag.qualification==1||row.revisionTag.qualification==2);
            if(!yes&&!known)unknown=true;else if(!yes)return 2;
        }
        return unknown?0:1;
    }
}

/// Real contract-paid consumer; no simulated gas or fabricated RPC result map.
contract FilesPagePaid {
    event Observed(bytes32 result,uint64 scanned,uint256 rows,uint8 scanStatus,bool completeFromOrigin,bool queryAbsent);
    function read(FilesPageReader reader,bytes32 folder,bytes32[] calldata authors,FilesPageReader.Query calldata query,
        FilesPageReader.Basis calldata basis,bytes calldata continuation,uint256 budget) external {
        FilesPageReader.Page memory page=reader.readPage(folder,authors,query,basis,continuation,budget);
        emit Observed(keccak256(abi.encode(page)),page.scanned,page.rows.length,page.scanStatus,page.completeFromOrigin,page.completeFromOrigin&&page.rows.length==0);
    }
    function queryAbsent(FilesPageReader reader,bytes32 folder,bytes32[] calldata authors,FilesPageReader.Query calldata query,
        FilesPageReader.Basis calldata basis,bytes calldata continuation,uint256 budget) external view returns(bool) {
        FilesPageReader.Page memory page=reader.readPage(folder,authors,query,basis,continuation,budget);
        return page.completeFromOrigin&&page.rows.length==0;
    }
}
