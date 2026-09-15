// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {IAcceptor} from "../src/Interfaces.sol";
import {Ledger} from "../src/Ledger.sol";
import {TypeRegistry} from "../src/TypeRegistry.sol";
import {Keys} from "../src/Keys.sol";

/// DISPOSABLE application profile. No Core nouns, subtype registry or View ABI.
/// Text domain: 1..1024 ASCII bytes (0x20..0x7e or LF). Title: 1..64 printable
/// ASCII bytes. This is a fixture choice, not an EFS/multilingual-design limit.
/// Canonical packed bytes, no ABI offsets/padding/trailing bytes:
/// v1:  "NTV1" | textLength:u16be | text
/// v11: "NT11" | textLength:u16be | text | titlePresent:u8 |
///      (if present==1: titleLength:u8 | title). Absent is exactly present==0.
/// v2:  "NTV2" | kind:u8 (1=plain,2=emphasized) | textLength:u16be | text.
library NoteBytes {
    function parse(bytes memory data,uint8 version) internal pure returns(bool valid,string memory text,bool emphasized,bool title) {
        if(data.length<7)return(false,"",false,false);
        bytes4 magic;assembly("memory-safe"){magic:=mload(add(data,32))}
        if(magic!=(version==0?bytes4("NTV1"):version==1?bytes4("NT11"):bytes4("NTV2")))return(false,"",false,false);
        uint256 offset=version==2?5:4;
        if(version==2){uint8 kind=uint8(data[4]);if(kind<1||kind>2)return(false,"",false,false);emphasized=kind==2;}
        uint256 length=uint256(uint8(data[offset]))*256+uint8(data[offset+1]);uint256 start=offset+2;uint256 end=start+length;
        if(length==0||length>1024||end>data.length)return(false,"",false,false);
        for(uint256 i=start;i<end;i++){uint8 c=uint8(data[i]);if((c<32||c>126)&&c!=10)return(false,"",false,false);}
        if(version==1){
            if(end>=data.length)return(false,"",false,false);
            uint8 present=uint8(data[end]);
            if(present==0){if(data.length!=end+1)return(false,"",false,false);}
            else if(present==1){
                if(data.length<end+2)return(false,"",false,false);
                uint8 n=uint8(data[end+1]);if(n==0||n>64||data.length!=end+2+n)return(false,"",false,false);
                for(uint256 i=end+2;i<data.length;i++){uint8 c=uint8(data[i]);if(c<32||c>126)return(false,"",false,false);}title=true;
            }else return(false,"",false,false);
        }else if(data.length!=end)return(false,"",false,false);
        // Cancun MCOPY avoids a second per-byte loop inside the Ledger's fixed
        // 300,000 gas mandatory-rule budget. Bounds above cover the exact slice.
        bytes memory out=new bytes(length);
        assembly("memory-safe"){mcopy(add(out,32),add(add(data,32),start),length)}
        return(true,string(out),emphasized,title);
    }
}

contract NoteV1Rule is IAcceptor {
    function accept(bytes32,bytes calldata data,bytes32[] calldata refs) external pure returns(bool){
        if(refs.length!=0)return false;(bool valid,,,)=NoteBytes.parse(data,0);return valid;
    }
}
contract NoteV11Rule is IAcceptor {
    function accept(bytes32,bytes calldata data,bytes32[] calldata refs) external pure returns(bool){
        if(refs.length!=0)return false;(bool valid,,,)=NoteBytes.parse(data,1);return valid;
    }
}
contract NoteV2Rule is IAcceptor {
    function accept(bytes32,bytes calldata data,bytes32[] calldata refs) external pure returns(bool){
        if(refs.length!=0)return false;(bool valid,,,)=NoteBytes.parse(data,2);return valid;
    }
}

/// Finite explicit point consumer. This is NOT Files HEAD selection. A transaction
/// calling consume pays for the entire qualified typed-Record read and projection.
contract NotePointReader {
    Ledger public immutable ledger;
    TypeRegistry public immutable registry;
    bytes32 public immutable ledgerCodeHash;
    bytes32 public immutable registryCodeHash;
    bytes32[3] public types;
    bytes32[3] public ruleHashes;
    struct Point {
        bytes32 recordId;bytes32 typeId;bytes body;string text;
        uint64 firstAdmission;uint32 occurrences;uint64 publication;address author;bytes32 principal;
        uint64 basisAdmission;uint64 epoch;uint256 blockNumber;bytes32 coreCodeHash;
        uint16 policyActivation;bytes32 ruleHash;bytes32 projectionId;bool lossy;bool titleOmitted;
    }
    error E_NOTE_PROFILE();error E_NOTE_RECORD();error E_NOTE_UNSUPPORTED();error E_NOTE_LOSS();
    event NoteRead(bytes32 indexed recordId,bytes32 indexed typeId,bytes32 textHash,bytes32 projectionId,bool lossy);
    constructor(address core,bytes32[3] memory exactTypes,bytes32[3] memory hashes){
        if(Ledger(core).implementationSelf()!=core)revert E_NOTE_PROFILE(); // no proxy-shell pin masquerading as implementation evidence
        ledger=Ledger(core);registry=TypeRegistry(address(Ledger(core).registry()));
        ledgerCodeHash=core.codehash;registryCodeHash=address(registry).codehash;
        types=exactTypes;ruleHashes=hashes;
        for(uint8 i;i<3;i++)_profile(i);
    }
    function _profile(uint8 version) private view {
        bytes32 typeId=types[version];bytes32 expected=ruleHashes[version];
        (bytes32 shape,bytes32 rule,address acceptor,uint8 count,,)=registry.descriptor(typeId);
        bytes32[] memory refs=registry.refTypes(typeId);
        bytes32 wanted=keccak256(bytes(version==0?"lab/type/note-ascii/v1":version==1?"lab/type/note-ascii/v1.1":"lab/type/note-ascii/v2"));
        if(expected==0||shape!=wanted||rule!=expected||acceptor.codehash!=rule||count!=0||refs.length!=0||Keys.typeId(shape,refs,rule)!=typeId)revert E_NOTE_PROFILE();
    }
    function read(bytes32 recordId,bool v2Adapter,bool allowLoss) public view returns(Point memory p){
        if(address(ledger).codehash!=ledgerCodeHash||address(registry).codehash!=registryCodeHash)revert E_NOTE_PROFILE();
        p.recordId=recordId;(p.typeId,p.firstAdmission,p.occurrences,p.body)=ledger.record(recordId);
        uint8 version=3;for(uint8 i;i<3;i++)if(p.typeId==types[i])version=i;
        if(version==3)revert E_NOTE_UNSUPPORTED();_profile(version);
        (p.basisAdmission,,,)=ledger.counts();p.epoch=registry.epoch();p.blockNumber=block.number;p.coreCodeHash=ledgerCodeHash;
        if(p.firstAdmission==0||p.firstAdmission>p.basisAdmission||Keys.recordFromHash(p.typeId,keccak256(p.body))!=recordId)revert E_NOTE_RECORD();
        (uint8 kind,,uint64 publication,,,,bytes32 bodyHash,bytes32 typeId)=ledger.admission(p.firstAdmission);
        if(kind!=1||bodyHash!=keccak256(p.body)||typeId!=p.typeId)revert E_NOTE_RECORD();p.publication=publication;
        (p.author,,,,,,,,,,,,)=ledger.evidence(publication);
        Ledger.PublicationContext memory provenance=ledger.publicationContext(publication);p.principal=provenance.principalId;
        (,p.policyActivation,,p.ruleHash,,,,)=ledger.acceptanceBasis(p.firstAdmission);
        bool valid;(valid,p.text,p.lossy,p.titleOmitted)=NoteBytes.parse(p.body,version);if(!valid)revert E_NOTE_RECORD();
        if(version==2&&!v2Adapter)revert E_NOTE_UNSUPPORTED();if(p.lossy&&!allowLoss)revert E_NOTE_LOSS();
        p.projectionId=keccak256(bytes(version==0?"lab/note-v1-text/1":version==1?"lab/note-v11-text/1":"lab/note-v2-to-text/1"));
    }
    function consume(bytes32 recordId,bool v2Adapter,bool allowLoss) external {
        Point memory p=read(recordId,v2Adapter,allowLoss);emit NoteRead(recordId,p.typeId,keccak256(bytes(p.text)),p.projectionId,p.lossy);
    }
}
