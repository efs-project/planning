// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {TagStanceReader} from "./TagStanceReader.sol";
contract TagStanceQueryAccumulator {
    address public immutable owner;
    bytes32 public immutable session;
    TagStanceReader public immutable reader;
    bytes32 public immutable readerHash;
    uint64 public immutable originAdmission;
    bytes32 public immutable queryCommitment;
    bytes32[] private _principals;
    TagStanceReader.Query private _query;
    TagStanceReader.Basis private _basis;
    bytes private _next;
    bool public started;
    bool public complete;
    uint64 public scanned;
    uint64 public rawTotal;
    uint64 public rowCount;
    uint64 public presentCount;
    uint64 public unknownCount;
    uint64 public prefixProbes;
    uint64 public historyProbes;
    uint64 public joins;
    uint64 public steps;
    bytes32 public resultCommitment;
    bytes32 public inventoryPin;
    error E_SESSION();error E_PROGRESS();
    event Rows(bytes32 indexed session,bytes encodedRows);
    event Progress(uint64 scanned,uint64 total,uint64 rows,uint64 present,uint64 unknowns,bytes32 commitment,bool complete);
    event Work(uint64 prefixProbes,uint64 historyProbes,uint64 joins,uint64 observedCurrent);
    constructor(TagStanceReader r,bytes32 expectedHash,bytes32[] memory principals,TagStanceReader.Query memory q,TagStanceReader.Basis memory b,bytes32 session_){
        if(session_==0||address(r).code.length==0||address(r).codehash!=expectedHash)revert E_SESSION();
        owner=msg.sender;reader=r;readerHash=expectedHash;session=session_;originAdmission=b.admission;
        _principals=principals;_query=q;_basis=b;
        queryCommitment=keccak256(abi.encode("efs.tag-owned-origin/1",address(this),msg.sender,session_,r,expectedHash,principals,q,b));
        resultCommitment=queryCommitment;
    }
    // No overrideable cursor, mutable query, reset or caller-supplied totals.
    // A raw reader cursor is a convenience token, never evidence of a prefix.
    function step(bytes32 session_,uint256 budget) external {
        if(msg.sender!=owner||session_!=session||complete||msg.data.length!=68||address(reader).codehash!=readerHash)revert E_SESSION();
        TagStanceReader.TagPage memory page=reader.readPage(_principals,_query,_basis,_next,budget);
        if(page.startsAtOrigin==started||page.scanStatus==0||page.queryAssessment!=1||page.observedCurrent<originAdmission)revert E_PROGRESS();
        if(!started){rawTotal=page.rawTotal;inventoryPin=page.inventoryPin;resultCommitment=keccak256(abi.encode(queryCommitment,inventoryPin,rawTotal));}
        if(page.inventoryPin!=inventoryPin||page.rawTotal!=rawTotal||(page.scanned==0&&(started||rawTotal!=0))
            ||page.scanned>rawTotal-scanned||page.selectedSoFar!=rowCount+page.rows.length||page.selectedSoFar>scanned+page.scanned)revert E_PROGRESS();
        scanned+=page.scanned;
        if(page.scanStatus==2){if(scanned!=rawTotal||page.continuation.length!=0)revert E_PROGRESS();complete=true;}
        else if(page.scanStatus!=1||scanned>=rawTotal||page.continuation.length==0)revert E_PROGRESS();
        uint64 unknowns;
        for(uint256 i;i<page.rows.length;i++){
            if(page.rows[i].assessment==0)++unknowns;
            else if(page.rows[i].assessment==1)++presentCount;
            else if(page.rows[i].assessment>3)revert E_PROGRESS();
            resultCommitment=keccak256(abi.encode(resultCommitment,keccak256(abi.encode(page.rows[i]))));
        }
        if(unknowns!=page.unknowns)revert E_PROGRESS();unknownCount+=unknowns;
        rowCount+=uint64(page.rows.length);_next=page.continuation;started=true;++steps;
        prefixProbes+=page.prefixProbes;historyProbes+=page.historyProbes;joins+=page.joins;
        emit Rows(session,abi.encode(page.rows));emit Work(page.prefixProbes,page.historyProbes,page.joins,page.observedCurrent);
        emit Progress(scanned,rawTotal,rowCount,presentCount,unknownCount,resultCommitment,complete);
    }
    function originAbsent() external view returns(bool){return complete&&presentCount==0&&unknownCount==0;}
}
