// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {FilesNamesIndex} from "./FilesNamesProfile.sol";
import {Ledger} from "../src/Ledger.sol";
import {LensReader} from "../src/LensReader.sol";
import {IndexModule} from "../src/IndexModule.sol";
import {Keys} from "../src/Keys.sol";
import {IndexReadinessProfile} from "../src/Interfaces.sol";
import {FilesScopeState} from "./FilesScopeState.sol";

/// Mandatory positive placement candidates beside immutable audit/history lists.
/// Removal masks remain in Ledger heads: they need not be candidates, because
/// every lower live candidate is still checked against all higher-author heads.
/// Dense swap-removal promises no sorted order. Explicit-principal continuation
/// may retain its origin only while all selected folder scopes remain unchanged.
contract FilesLiveNamesIndex is FilesNamesIndex {
    bytes32 public constant FAMILY_LIVE_SCOPE = keccak256("lab/family/live-files-scope/1");
    FilesScopeState private immutable _scopeState;
    bytes32 public immutable scopeStateCodehash;
    function _extensionEntry(bytes32 f) internal view virtual override returns(ManifestEntry memory){
        if(f==FAMILY_LIVE_SCOPE)return ManifestEntry(f,0,3,3,keccak256("live-positive-folder-binding-ordinals:dense-swap:scopeList:last-mutation-every-bind-unbind"),true);
        return super._extensionEntry(f);
    }
    constructor(address c,bytes32 rt,bytes32 ct,bytes32 rh,bytes32 ch,bytes32 nt,bytes32 nh)
        FilesNamesIndex(c,rt,ct,rh,ch,nt,nh) {
        _scopeState=new FilesScopeState(c);scopeStateCodehash=address(_scopeState).codehash;
        _declare(FAMILY_LIVE_SCOPE,true,attachedFrom);
    }
    function _physicalProfile() internal pure override returns(bytes32) { return IndexReadinessProfile.FILES_SPLIT; }
    function scopeState() public view returns(FilesScopeState) {
        if(address(_scopeState).codehash!=scopeStateCodehash)revert E_FIELD();
        return _scopeState;
    }
    function _foldEffect(Effect memory e) internal virtual override {
        super._foldEffect(e);
        if(e.kind==3 || e.kind==4)scopeState().fold(e.kind,e.bindingOrdinal,e.scopeKey,e.admission);
    }
    function liveCount(bytes32 key) external view returns(uint64) { return scopeState().liveCount(key); }
    function liveAt(bytes32 key,uint64 i) external view returns(uint64) { return scopeState().liveAt(key,i); }
    function lastMutation(bytes32 key) external view returns(uint64) { return scopeState().lastMutation(key); }
}
contract FilesLiveLens is LensReader {
    bytes32 private constant FOLDER = keccak256("efs2/purpose/folder/1");
    constructor(Ledger c,IndexModule i) LensReader(c,i) {}
    function _continuationBasis(bytes32[] memory principals,bytes32 purpose,bytes32 subject,uint64 origin,uint64 current)
        internal view override
    {
        if(purpose!=FOLDER){super._continuationBasis(principals,purpose,subject,origin,current);return;}
        if(origin>current)revert E_CURSOR();
        FilesLiveNamesIndex files=FilesLiveNamesIndex(address(index));
        (uint8 cov,uint64 from,uint64 through)=index.coverage(files.FAMILY_LIVE_SCOPE(),keccak256(abi.encode(purpose,subject)));
        if(cov!=COMPLETE||from!=1||through!=current||index.provenFrom()!=1)revert E_CURSOR();
        _checkScopeState();
        // Deliberately inspect the full selector list, not just the suffix:
        // consumed, empty and terminal scopes can invalidate the origin too.
        for(uint256 i;i<principals.length;i++)
            if(files.lastMutation(Keys.scopeList(Keys.scope(principals[i],purpose,subject)))>origin)revert E_CURSOR();
    }
    function _checkScopeState() private view {
        FilesLiveNamesIndex files=FilesLiveNamesIndex(address(index));FilesScopeState state=files.scopeState();
        if(address(state.ledger())!=address(ledger)||state.writer()!=address(index)||address(state).codehash!=files.scopeStateCodehash())revert E_CURSOR();
    }
    function list(address[] calldata authors,bytes32 purpose,bytes32 subject,Cursor calldata cursor,uint256 budget)
        public view override returns(Page memory)
    {
        if(purpose==FOLDER && cursor.basisAdmission!=0){
            (uint64 current,,,)=ledger.counts();if(cursor.basisAdmission!=current)revert E_CURSOR();
        }
        return super.list(authors,purpose,subject,cursor,budget);
    }
    function _scopeFamily(bytes32 purpose) internal view override returns(bytes32){
        if(purpose==FOLDER){_checkScopeState();return FilesLiveNamesIndex(address(index)).FAMILY_LIVE_SCOPE();}
        return super._scopeFamily(purpose);
    }
    function _scopeCount(bytes32 purpose,bytes32 key) internal view override returns(uint64){
        return purpose==FOLDER?FilesLiveNamesIndex(address(index)).liveCount(key):super._scopeCount(purpose,key);
    }
    function _scopeAt(bytes32 purpose,bytes32 key,uint64 i) internal view override returns(uint64){
        return purpose==FOLDER?FilesLiveNamesIndex(address(index)).liveAt(key,i):super._scopeAt(purpose,key,i);
    }
}
