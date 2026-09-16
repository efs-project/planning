// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {FilesPageReader} from "./FilesPageReader.sol";

/// Disposable owned-prefix consumer. No caller-supplied suffix or mutable query.
contract FilesQueryAccumulator {
    address public immutable owner;
    bytes32 public immutable session;
    FilesPageReader public immutable reader;
    bytes32 public immutable readerCodehash;
    uint64 public immutable originAdmission;
    bytes32 public immutable queryCommitment;
    bytes32 private _folder;
    bytes32[] private _principals;
    FilesPageReader.Query private _query;
    FilesPageReader.Basis private _basis;
    bytes private _next;
    bool public started;
    bool public complete;
    uint64 public scanned;
    uint64 public rawTotal;
    uint64 public rowCount;
    uint64 public unknownCount;
    uint64 public selectedSoFar;
    uint64 public observedCurrent;
    bytes32 public resultCommitment;
    bytes32 public inventoryPin;
    error E_SESSION(); error E_PROGRESS();
    event Progress(bytes32 indexed session,uint64 origin,uint64 current,uint64 scanned,uint64 total,uint64 rows,uint64 unknowns,bytes32 commitment,bool complete);
    event Rows(bytes32 indexed session,bytes encodedRows);
    event PrefixWork(uint64 comparisons,uint64 gasDiagnostic);
    constructor(FilesPageReader reader_,bytes32 folder,bytes32[] memory principals,FilesPageReader.Query memory query,FilesPageReader.Basis memory basis,bytes32 session_) {
        if(session_==0||address(reader_).code.length==0)revert E_SESSION();
        owner=msg.sender;session=session_;reader=reader_;readerCodehash=address(reader_).codehash;originAdmission=basis.admission;
        _folder=folder;_principals=principals;_query=query;_basis=basis;
        queryCommitment=keccak256(abi.encode("efs.files-owned-origin/1",address(this),msg.sender,session_,reader_,folder,principals,query,basis));
        resultCommitment=queryCommitment;
    }
    /// Only this owned cursor is used. The fixed ABI rejects appended suffixes;
    /// there is no restart, caller override, query update or arbitrary resume.
    function step(bytes32 session_,uint256 budget) external {
        if(msg.sender!=owner||session_!=session||complete||msg.data.length!=68||address(reader).codehash!=readerCodehash)revert E_SESSION();
        FilesPageReader.Page memory page=reader.readPage(_folder,_principals,_query,_basis,_next,budget);
        if(page.startsAtOrigin==started||page.scanStatus==0||page.observedCurrent<originAdmission)revert E_PROGRESS();
        if(!started){
            rawTotal=page.rawTotal;inventoryPin=page.inventoryPin;
            resultCommitment=keccak256(abi.encode(queryCommitment,inventoryPin,rawTotal));
        }
        if(page.inventoryPin!=inventoryPin||page.rawTotal!=rawTotal||(page.scanned==0&&(started||rawTotal!=0))
            ||page.scanned>rawTotal-scanned||page.selectedSoFar<selectedSoFar
            ||page.selectedSoFar>scanned+page.scanned||page.rows.length>page.selectedSoFar-selectedSoFar)revert E_PROGRESS();
        scanned+=page.scanned;selectedSoFar=page.selectedSoFar;observedCurrent=page.observedCurrent;
        if(page.scanStatus==2){
            if(scanned!=rawTotal||page.continuation.length!=0)revert E_PROGRESS();
            complete=true;
        }else if(page.scanStatus!=1||scanned>=rawTotal||page.continuation.length==0)revert E_PROGRESS();
        for(uint256 i;i<page.rows.length;i++){
            if(page.rows[i].matchStatus==0)++unknownCount;
            resultCommitment=keccak256(abi.encode(resultCommitment,keccak256(abi.encode(page.rows[i]))));
        }
        rowCount+=uint64(page.rows.length);_next=page.continuation;started=true;
        emit Rows(session,abi.encode(page.rows));
        emit PrefixWork(page.prefixProbes,page.prefixGas);
        emit Progress(session,originAdmission,observedCurrent,scanned,rawTotal,rowCount,unknownCount,resultCommitment,complete);
    }
    /// Absence at origin only. This flag grants no authority over a current
    /// effect, whose dependency read-set must be checked in its own transaction.
    function originAbsent() external view returns(bool) { return complete&&rowCount==0&&unknownCount==0; }
}
