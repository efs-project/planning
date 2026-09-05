// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

library LabRead {
    enum Status { FOUND, UNKNOWN, MISMATCH, UNSUPPORTED }
    struct FileResult { Status status; bytes32 fileId; uint64 revision; bytes32 contentId; bytes32 previous; }
    uint256 private constant CALL_GAS=60000;
    // Return buffers are never implicitly copied by Solidity. Inspect the exact
    // length first; malicious returndata cannot force an unbounded allocation.
    function _call(address target,bytes memory input,uint256 cap) private view returns(bool ok,bytes memory data) {
        uint256 size;
        assembly {
            ok:=staticcall(CALL_GAS,target,add(input,32),mload(input),0,0)
            size:=returndatasize()
        }
        if(!ok||size>cap) return(false,new bytes(0));
        data=new bytes(size);
        assembly { returndatacopy(add(data,32),0,size) }
    }
    function _word(bytes memory b,uint256 offset) private pure returns(bytes32 w) { assembly { w:=mload(add(add(b,32),offset)) } }
    function _pin(address core,bytes32 codeHash,bytes32 runId,uint16 profile) private view returns(Status) {
        if(profile!=1) return Status.UNSUPPORTED;
        if(core==address(0)||core.code.length==0||core.codehash!=codeHash) return Status.MISMATCH;
        (bool ok,bytes memory b)=_call(core,abi.encodeWithSignature("runId()"),32);
        if(!ok||b.length!=32) return Status.UNKNOWN;
        if(_word(b,0)!=runId) return Status.MISMATCH;
        return Status.FOUND;
    }
    function currentFile(address core,bytes32 codeHash,bytes32 runId,uint16 profile,bytes32 fileId) internal view returns(FileResult memory r) {
        r.fileId=fileId; r.status=_pin(core,codeHash,runId,profile); if(r.status!=Status.FOUND) return r;
        r.status=Status.UNKNOWN;
        (bool ok,bytes memory b)=_call(core,abi.encodeWithSignature("getNode(bytes32)",fileId),256);
        if(!ok||b.length<192||_word(b,0)!=bytes32(uint256(32))||_word(b,96)!=bytes32(uint256(128))) return r;
        uint256 nameLength=uint256(_word(b,160)); uint256 revision=uint256(_word(b,128));
        if(nameLength>64||b.length!=192+((nameLength+31)/32)*32||revision>type(uint64).max) return r;
        if(_word(b,32)!=bytes32(uint256(2))) { r.status=Status.UNSUPPORTED; return r; }
        if(revision==0) return r;
        (ok,b)=_call(core,abi.encodeWithSignature("getRevision(bytes32,uint64)",fileId,uint64(revision)),64);
        if(!ok||b.length!=64||_word(b,0)==0) return r;
        r.status=Status.FOUND; r.revision=uint64(revision); r.contentId=_word(b,0); r.previous=_word(b,32);
    }
    function score(address core,bytes32 codeHash,bytes32 runId,uint16 profile,bytes32 recordId,bytes32 schemaId) internal view returns(Status,uint64) {
        Status status=_pin(core,codeHash,runId,profile); if(status!=Status.FOUND) return(status,0);
        (bool ok,bytes memory b)=_call(core,abi.encodeWithSignature("getRecord(bytes32)",recordId),64);
        if(!ok||b.length!=64) return(Status.UNKNOWN,0);
        if(_word(b,0)!=schemaId) return(Status.MISMATCH,0);
        bytes32 contentId=_word(b,32);
        (ok,b)=_call(core,abi.encodeWithSignature("getSchema(bytes32)",schemaId),96);
        if(!ok||b.length!=96||_word(b,0)!=bytes32(uint256(32))||_word(b,32)!=bytes32(uint256(1))) return(Status.UNKNOWN,0);
        if(_word(b,64)!=bytes32(uint256(1)<<248)) return(Status.UNSUPPORTED,0);
        bytes32 wantedSchema=keccak256(abi.encode(keccak256("efs-lab/schema/1"),keccak256(hex"01")));
        if(schemaId!=wantedSchema) return(Status.MISMATCH,0);
        (ok,b)=_call(core,abi.encodeWithSignature("byteStore()"),32);
        if(!ok||b.length!=32||uint256(_word(b,0))>type(uint160).max) return(Status.UNKNOWN,0);
        address carrier=address(uint160(uint256(_word(b,0))));
        if(carrier.code.length==0) return(Status.UNKNOWN,0);
        (ok,b)=_call(carrier,abi.encodeWithSignature("core()"),32);
        if(!ok||b.length!=32||_word(b,0)!=bytes32(uint256(uint160(core)))) return(Status.MISMATCH,0);
        (ok,b)=_call(carrier,abi.encodeWithSignature("read(bytes32)",contentId),96);
        if(!ok||b.length!=96||_word(b,0)!=bytes32(uint256(32))||_word(b,32)!=bytes32(uint256(8))) return(Status.UNKNOWN,0);
        uint256 word=uint256(_word(b,64)); if(uint192(word)!=0) return(Status.UNKNOWN,0);
        uint64 value=uint64(word>>192); bytes32 payloadHash=keccak256(abi.encodePacked(value));
        if(contentId!=keccak256(abi.encode(keccak256("efs-lab/bytes/1"),payloadHash))||recordId!=keccak256(abi.encode(keccak256("efs-lab/record/1"),schemaId,payloadHash))) return(Status.MISMATCH,0);
        return(Status.FOUND,value);
    }
}
