// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {Ledger} from "../src/Ledger.sol";
import {LensReader} from "../src/LensReader.sol";
import {FilesPageReader} from "./FilesPageReader.sol";
import {LiveFilesIndex,LiveFilesLayout} from "./LiveFilesProfile.sol";
import {FilesLayout} from "./FilesJoinedProfile.sol";
import {Keys} from "../src/Keys.sol";
import {LiveFilesAdapter,LiveQuoteProvider} from "./LiveFilesAdapter.sol";

contract LiveFilesPageReader is FilesPageReader {
    constructor(Ledger c,LensReader l,LiveFilesIndex i) FilesPageReader(c,l,i){}
    function readHeader(bytes32 id,bytes32 file,uint64 through) public view override returns(Header memory h){
        if(msg.sender!=address(this))revert E_QUERY();
        LiveFilesIndex live=LiveFilesIndex(address(index));
        h.recordId=id;(h.typeId,h.firstAdmission,h.bodyLength)=FilesLayout.header(ledger,id);
        bool child=h.typeId==live.liveTypes(2);
        if(!child&&h.typeId!=live.liveTypes(1))return super.readHeader(id,file,through);
        uint256 prefix=child?3:2;
        if(h.firstAdmission==0||h.firstAdmission>through||h.bodyLength!=prefix*32||FilesLayout.word(ledger,id,prefix-1)!=file){h.qualification=3;return h;}
        (uint8 kind,,,,,,bytes32 hash,bytes32 t)=ledger.admission(h.firstAdmission);
        if(kind!=1||t!=h.typeId||Keys.recordFromHash(t,hash)!=id){h.qualification=3;return h;}
        if(child){
            h.parent=FilesLayout.word(ledger,id,0);
            bytes32[5] memory parents=[index.rootType(),index.childType(),index.carrierTypes(2),index.carrierTypes(3),live.liveTypes(1)];
            if(!LiveFilesLayout.sameFile(ledger,h.parent,file,parents,live.liveTypes(2),h.firstAdmission)){h.qualification=3;return h;}
        }
        h.descriptor=FilesLayout.word(ledger,id,prefix-2);
        (bytes32 dt,uint64 first,uint32 length)=FilesLayout.header(ledger,h.descriptor);
        if(dt!=live.liveTypes(0)||first==0||first>=h.firstAdmission||length!=384){h.qualification=3;return h;}
        h.qualification=1; // retained descriptor membership, NOT provider availability
    }
}

/// Explicit live-aware path. The old FilesJoinedConsumer remains inline-only.
contract LiveFilesMountedReader {
    uint8 public constant UNKNOWN=0;
    uint8 public constant LIVE_SHAPE_ONLY=1;
    uint8 public constant STORED_BYTES=2;
    uint8 public constant OPAQUE_ENCRYPTED=3;
    uint8 public constant EXTERNAL_UNSUPPORTED=4;
    uint8 public constant SELECTED_PROVIDER_FAILED=5;
    uint8 public constant NOT_ON_THIS_PAGE=6;
    uint8 public constant ABSENT_PROVEN=7;
    struct Result {
        uint8 status; bytes32 file; bytes32 revision; bytes32 descriptor;
        uint64 selectionOrigin; uint256 observationBlock; uint256 observationChain;
        bytes raw; LiveFilesAdapter.Observation live;bytes continuation;bool descriptorsCompleteFromOrigin;
    }
    LiveFilesPageReader public immutable page;
    LiveFilesAdapter public immutable adapter;
    bytes32 public immutable pageHash;
    bytes32 public immutable adapterHash;
    constructor(LiveFilesPageReader p,LiveFilesAdapter a){
        page=p;adapter=a;pageHash=address(p).codehash;adapterHash=address(a).codehash;
        require(address(a.ledger())==address(p.ledger())&&a.descriptorType()==LiveFilesIndex(address(p.index())).liveTypes(0),"live context");
    }
    // A selected row with uncertain HEAD/header remains UNKNOWN. A missing row
    // is ABSENT_PROVEN only after one complete origin-started scan; a partial
    // or suffix page is merely NOT_ON_THIS_PAGE. No client may infer absence
    // from an empty page or the default zero value of Result.
    function read(bytes32 folder,bytes32[] calldata principals,bytes32 role,FilesPageReader.Basis calldata basis,bytes calldata continuation,uint256 budget)
        public view returns(Result memory result){
        require(address(page).codehash==pageHash&&address(adapter).codehash==adapterHash,"reader code drift");
        result.selectionOrigin=basis.admission;result.observationBlock=block.number;result.observationChain=block.chainid;
        FilesPageReader.Query memory query;
        FilesPageReader.Page memory p=page.readPage(folder,principals,query,basis,continuation,budget);
        result.continuation=p.continuation;result.descriptorsCompleteFromOrigin=p.completeFromOrigin;
        LiveFilesIndex index=LiveFilesIndex(address(page.index()));Ledger ledger=page.ledger();
        for(uint256 i;i<p.rows.length;i++){
            FilesPageReader.Row memory row=p.rows[i];if(row.role!=role)continue;
            result.file=row.placement.target;result.revision=row.head.target;result.descriptor=row.header.descriptor;
            if(row.head.status!=1||row.header.qualification!=1)return result;
            bytes32 t=row.header.typeId;
            if(t==index.liveTypes(1)||t==index.liveTypes(2)){
                result.live=adapter.observe(result.descriptor,basis.admission);
                result.status=result.live.status==1?1:5;result.raw=result.live.raw;return result;
            }
            uint256 skip;
            bytes memory body;
            if(t==index.rootType()||t==index.childType()){
                (,,,body)=ledger.record(result.revision);skip=t==index.rootType()?32:64;
            }else if(t==index.carrierTypes(2)||t==index.carrierTypes(3)){
                if(FilesLayout.word(ledger,result.descriptor,7)!=0){result.status=3;return result;}
                if(FilesLayout.word(ledger,result.descriptor,2)!=0){result.status=4;return result;}
                bytes32 rawId=FilesLayout.word(ledger,result.descriptor,0);
                (,,,body)=ledger.record(rawId);skip=32;
            }else return result;
            result.raw=new bytes(body.length-skip);
            for(uint256 j;j<result.raw.length;j++)result.raw[j]=body[j+skip];
            if(result.descriptor!=0&&sha256(result.raw)!=FilesLayout.word(ledger,result.descriptor,5))return result;
            result.status=2;return result;
        }
        if(p.completeFromOrigin)result.status=ABSENT_PROVEN;
        else if(p.scanStatus==1||p.scanStatus==2)result.status=NOT_ON_THIS_PAGE;
    }
}

contract LiveFilesPaid {
    event Observed(bytes32 file,bytes32 revision,uint8 status,uint8 liveStatus,bytes raw,uint64 selectionOrigin,uint256 observationBlock);
    function read(LiveFilesMountedReader reader,bytes32 folder,bytes32[] calldata principals,bytes32 role,FilesPageReader.Basis calldata basis) public {
        LiveFilesMountedReader.Result memory r=reader.read(folder,principals,role,basis,"",256);
        emit Observed(r.file,r.revision,r.status,r.live.status,r.raw,r.selectionOrigin,r.observationBlock);
    }
    function updateAndRead(LiveQuoteProvider provider,uint128 value,bool flag,LiveFilesMountedReader reader,bytes32 folder,
        bytes32[] calldata principals,bytes32 role,FilesPageReader.Basis calldata basis) external {
        provider.update(value,flag,0,address(reader.adapter()));read(reader,folder,principals,role,basis);
    }
    function readOrigin(LiveFilesMountedReader reader,bytes32 folder,bytes32[] calldata principals,bytes32 role,
        FilesPageReader.Basis calldata basis,bytes calldata continuation,uint256 budget) external {
        LiveFilesMountedReader.Result memory r=reader.read(folder,principals,role,basis,continuation,budget);
        emit Observed(r.file,r.revision,r.status,r.live.status,r.raw,r.selectionOrigin,r.observationBlock);
    }
    function updateAndStore(LiveQuoteProvider provider,uint128 value,bool flag,address adapter,Ledger ledger,bytes32 outputType) external {
        provider.update(value,flag,0,adapter);ledger.publish(outputType,abi.encode(value,flag));
    }
}
