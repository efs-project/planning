// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {FilesNamesIndex} from "./FilesNamesProfile.sol";
import {Ledger} from "../src/Ledger.sol";
import {LensReader} from "../src/LensReader.sol";
import {IndexModule} from "../src/IndexModule.sol";
import {Keys} from "../src/Keys.sol";

/// Mandatory positive placement candidates beside immutable audit/history lists.
/// Removal masks remain in Ledger heads: they need not be candidates, because
/// every lower live candidate is still checked against all higher-author heads.
/// Dense swap-removal deliberately promises no sorted order. Continuations are
/// valid only at exactly the same admission/block basis (see FilesLiveLens).
contract FilesLiveNamesIndex is FilesNamesIndex {
    bytes32 public constant FAMILY_LIVE_SCOPE = keccak256("lab/family/live-files-scope/1");
    bytes32 private constant FOLDER = keccak256("efs2/purpose/folder/1");
    mapping(bytes32 => uint64[]) private _live;
    mapping(uint64 => uint256) private _offsetPlusOne;
    function _extensionEntry(bytes32 f) internal view override returns(ManifestEntry memory){
        if(f==FAMILY_LIVE_SCOPE)return ManifestEntry(f,0,3,3,keccak256("live-positive-folder-binding-ordinals:dense-swap:scopeList"),true);
        return super._extensionEntry(f);
    }
    constructor(address c,bytes32 rt,bytes32 ct,bytes32 rh,bytes32 ch,bytes32 nt,bytes32 nh)
        FilesNamesIndex(c,rt,ct,rh,ch,nt,nh) {_declare(FAMILY_LIVE_SCOPE,true,attachedFrom);}
    function _foldEffect(Effect memory e) internal virtual override {
        super._foldEffect(e);
        Ledger core=Ledger(ledger);
            if(e.kind!=3 && e.kind!=4)return;
            (bytes32 purpose,,)=core.positionCell(core.bindingPosition(e.bindingOrdinal));
            if(purpose!=FOLDER)return;
            uint64[] storage active=_live[Keys.scopeList(e.scopeKey)];
            uint256 oneBased=_offsetPlusOne[e.bindingOrdinal];
            if(e.kind==3){
                if(oneBased==0){active.push(e.bindingOrdinal);_offsetPlusOne[e.bindingOrdinal]=active.length;}
            }else if(oneBased!=0){
                uint256 removed=oneBased-1;uint256 last=active.length-1;
                if(removed!=last){uint64 moved=active[last];active[removed]=moved;_offsetPlusOne[moved]=oneBased;}
                active.pop();delete _offsetPlusOne[e.bindingOrdinal];
            }
    }
    function liveCount(bytes32 key) external view returns(uint64) { return uint64(_live[key].length); }
    function liveAt(bytes32 key,uint64 i) external view returns(uint64) { return _live[key][i]; }
}
contract FilesLiveLens is LensReader {
    bytes32 private constant FOLDER = keccak256("efs2/purpose/folder/1");
    constructor(Ledger c,IndexModule i) LensReader(c,i) {}
    function list(address[] calldata authors,bytes32 purpose,bytes32 subject,Cursor calldata cursor,uint256 budget)
        public view override returns(Page memory)
    {
        if(purpose==FOLDER && cursor.basisAdmission!=0){
            (uint64 current,,,)=ledger.counts();if(cursor.basisAdmission!=current)revert E_CURSOR();
        }
        return super.list(authors,purpose,subject,cursor,budget);
    }
    function _scopeFamily(bytes32 purpose) internal view override returns(bytes32){
        return purpose==FOLDER?FilesLiveNamesIndex(address(index)).FAMILY_LIVE_SCOPE():super._scopeFamily(purpose);
    }
    function _scopeCount(bytes32 purpose,bytes32 key) internal view override returns(uint64){
        return purpose==FOLDER?FilesLiveNamesIndex(address(index)).liveCount(key):super._scopeCount(purpose,key);
    }
    function _scopeAt(bytes32 purpose,bytes32 key,uint64 i) internal view override returns(uint64){
        return purpose==FOLDER?FilesLiveNamesIndex(address(index)).liveAt(key,i):super._scopeAt(purpose,key,i);
    }
}
