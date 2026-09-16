// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {LensReader} from "../src/LensReader.sol";
import {Ledger} from "../src/Ledger.sol";
import {IndexModule} from "../src/IndexModule.sol";
import {Keys} from "../src/Keys.sol";

/// Separate retained-inventory profile; never labelled fast-live pagination.
contract FilesRetainedLens is LensReader {
    bytes32 private constant FOLDER=keccak256("efs2/purpose/folder/1");
    constructor(Ledger core,IndexModule module) LensReader(core,module) {}

    /// This new profile exposes only explicit-principal pagination. Legacy
    /// point reads stay inherited; no address cursor bypasses retained pins.
    function list(address[] calldata,bytes32,bytes32,Cursor calldata,uint256) public pure override returns(Page memory){revert E_LENS();}

    function _continuationBasis(bytes32[] memory,bytes32 purpose,bytes32,uint64 origin,uint64 current) internal view override {
        if(purpose!=FOLDER){if(origin!=current)revert E_CURSOR();return;}
        _historicalBasis(origin,ledger.executionSet());
    }

    /// First binding admissions increase with scope-list append order. Their
    /// retained history entry0 is immutable, so an upper bound authenticates
    /// the origin prefix even as the current append-only inventory grows.
    function _originCounts(bytes32[] memory principals,bytes32 subject,uint64 origin,bytes32 execution)
        private view returns(uint64[] memory counts,uint64 total,uint64 probes)
    {
        _historicalBasis(origin,execution);
        (uint64 current,,,)=ledger.counts();
        (uint8 cov,uint64 from,uint64 through)=index.coverage(index.FAMILY_SCOPE(),keccak256(abi.encode(FOLDER,subject)));
        if(cov!=COMPLETE||from!=1||through!=current)revert E_CURSOR();
        counts=new uint64[](principals.length);
        for(uint256 i;i<principals.length;i++){
            bytes32 key=Keys.scopeList(Keys.scope(principals[i],FOLDER,subject));
            (uint64 hi,,,)=index.postingHead(key);uint64 lo;
            while(lo<hi){
                uint64 mid=lo+(hi-lo)/2;
                bytes32 position=ledger.bindingPosition(index.postingAt(key,mid));
                uint64 first=index.postingAt(Keys.historyList(Keys.binding(principals[i],position)),0);
                if(first==0)revert E_CURSOR();++probes;
                if(first<=origin)lo=mid+1;else hi=mid;
            }
            counts[i]=lo;total+=lo;
        }
    }

    function _scan(bytes32[] memory principals,bytes32 purpose,bytes32 subject,PrincipalCursor memory cursor,uint256 budget)
        internal view override returns(ScanPage memory page)
    {
        if(purpose!=FOLDER)return super._scan(principals,purpose,subject,cursor,budget);
        if(budget>MAX_BUDGET)budget=MAX_BUDGET;
        uint256 beforeGas=gasleft();uint64[] memory counts;
        (counts,page.rawTotal,page.prefixProbes)=_originCounts(principals,subject,cursor.basisAdmission,cursor.executionSet);
        page.inventoryPin=keccak256(abi.encode("efs.files-retained-prefix/1",cursor.basisAdmission,principals,subject,counts));
        page.prefixGas=uint64(beforeGas-gasleft());page.items=new Selection[](budget);
        uint256 filled;uint256 k=cursor.lensIndex;uint64 j=cursor.rawIndex;
        while(k<principals.length){
            bytes32 key=Keys.scopeList(Keys.scope(principals[k],purpose,subject));
            while(j<counts[k]){
                if(page.scanned>=budget){cursor.lensIndex=uint8(k);cursor.rawIndex=j;return _finishScan(page,cursor,filled,PARTIAL);}
                bytes32 position=ledger.bindingPosition(index.postingAt(key,j++));
                (uint8 state,bytes32 target,uint32 revision,uint64 at)=_headAt(principals[k],position,cursor.basisAdmission);
                ++page.scanned;++page.hydrations;if(state!=1)continue;
                bool masked;
                for(uint256 i;i<k;i++){
                    ++page.hydrations;(uint8 higher,,,)=_headAt(principals[i],position,cursor.basisAdmission);
                    if(higher!=0){masked=true;break;}
                }
                if(masked)continue;
                page.items[filled++]=Selection(position,k,target,revision,at);++cursor.selectedSoFar;cursor.position=position;
            }
            ++k;j=0;
        }
        cursor.lensIndex=uint8(principals.length);cursor.rawIndex=0;
        return _finishScan(page,cursor,filled,COMPLETE);
    }
}
