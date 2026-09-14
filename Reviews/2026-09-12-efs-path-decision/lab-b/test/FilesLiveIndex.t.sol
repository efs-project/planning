// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {FilesNamesTest} from "./FilesNames.t.sol";
import {FilesLiveNamesIndex,FilesLiveLens} from "./FilesLiveIndex.sol";
import {Ledger} from "../src/Ledger.sol";
import {LensReader} from "../src/LensReader.sol";
import {Keys} from "../src/Keys.sol";

contract FilesLiveIndexTest is FilesNamesTest {
    FilesLiveNamesIndex internal liveIndex;
    function setUp() public override {
        super.setUp();
        liveIndex=new FilesLiveNamesIndex(address(ledger),rootType,childType,address(rootRule).codehash,
            address(childRule).codehash,nameType,address(nameRule).codehash);
        namesIndex=liveIndex;index=liveIndex;ledger.setIndexModule(address(index));lens=new FilesLiveLens(ledger,index);
    }
    function _liveKey(address author) internal view returns(bytes32){return Keys.scopeList(Keys.scope(pid(author),FOLDER,MOUNT));}
    function test_live_removal_swaps_dense_candidate_without_erasing_audit() public {
        _create(1,bytes("a.txt"),true,0);_create(2,bytes("b.txt"),true,0);_create(3,bytes("c.txt"),true,0);
        require(liveIndex.liveCount(_liveKey(eoaA))==3,"three live placements");
        _submit(one(aUnbind(FOLDER,MOUNT,keccak256("b.txt"),1)),new bytes[](1));
        require(liveIndex.liveCount(_liveKey(eoaA))==2,"dense live removal");
        (uint64 auditCount,,,)=index.postingHead(_liveKey(eoaA));require(auditCount==3,"history retained");
        LensReader.Page memory p=_members(2);require(p.rawTotal==2 && p.scanned==2,"only live candidates read");
    }
    function test_live_higher_mask_still_suppresses_lower_positive_candidate() public {
        (bytes32 file,)=_create(1,bytes("a.txt"),true,0);
        bob.bind(FOLDER,MOUNT,keccak256("a.txt"),file,0);
        _submit(one(aUnbind(FOLDER,MOUNT,keccak256("a.txt"),1)),new bytes[](1));
        require(liveIndex.liveCount(_liveKey(eoaA))==0 && liveIndex.liveCount(_liveKey(address(bob)))==1,"only positive candidate remains");
        LensReader.Page memory p=_members(0);require(p.rawTotal==1 && p.scanned==1,"lower positive masked by retained head");
    }
    function test_live_rebind_is_not_duplicate_and_restore_readds_once() public {
        (bytes32 file,)=_create(1,bytes("a.txt"),true,0);
        _submit(one(aBind(FOLDER,MOUNT,keccak256("a.txt"),file,1)),new bytes[](1));
        require(liveIndex.liveCount(_liveKey(eoaA))==1,"rebind no duplicate");
        _submit(one(aUnbind(FOLDER,MOUNT,keccak256("a.txt"),2)),new bytes[](1));
        _submit(one(aBind(FOLDER,MOUNT,keccak256("a.txt"),file,3)),new bytes[](1));
        require(liveIndex.liveCount(_liveKey(eoaA))==1,"restore once");_members(1);
    }
    function test_live_32_renames_scan_one_not_33() public {
        bytes memory previous="churn.txt";(bytes32 file,)=_create(1,previous,true,0);
        for(uint256 i;i<32;i++){
            bytes memory next=abi.encodePacked("n-",bytes1(uint8(48+i/10)),bytes1(uint8(48+i%10)),".txt");
            Ledger.Action[] memory a=new Ledger.Action[](3);bytes[] memory b=new bytes[](3);
            a[0]=aPublish(nameType,next);b[0]=next;
            a[1]=aUnbind(FOLDER,MOUNT,keccak256(previous),1);a[2]=aBind(FOLDER,MOUNT,keccak256(next),file,0);
            _submit(a,b);previous=next;
        }
        (uint64 auditCount,,,)=index.postingHead(_liveKey(eoaA));require(auditCount==33,"all audit names retained");
        LensReader.Page memory p=_members(1);require(p.rawTotal==1 && p.scanned==1,"lifetime work removed");
    }
    function test_live_swap_removal_invalidates_unpinned_continuation() public {
        _create(1,bytes("a.txt"),true,0);_create(2,bytes("b.txt"),true,0);
        LensReader.Cursor memory zero;
        LensReader.Page memory p=lens.list(lensOf(eoaA,address(bob)),FOLDER,MOUNT,zero,1);
        require(p.status==lens.PARTIAL(),"partial first page");
        _submit(one(aUnbind(FOLDER,MOUNT,keccak256("a.txt"),1)),new bytes[](1));
        (bool ok,bytes memory error)=address(lens).staticcall(abi.encodeCall(lens.list,(lensOf(eoaA,address(bob)),FOLDER,MOUNT,p.next,1)));
        require(!ok && bytes4(error)==LensReader.E_CURSOR.selector,"live cursor requires unchanged admission");
    }
    function test_live_late_attachment_never_claims_complete_empty() public {
        _create(1,bytes("a.txt"),true,0);
        FilesLiveNamesIndex late=new FilesLiveNamesIndex(address(ledger),rootType,childType,address(rootRule).codehash,
            address(childRule).codehash,nameType,address(nameRule).codehash);
        ledger.setIndexModule(address(late));LensReader lateLens=new FilesLiveLens(ledger,late);LensReader.Cursor memory zero;
        LensReader.Page memory p=lateLens.list(lensOf(eoaA,address(bob)),FOLDER,MOUNT,zero,32);
        require(p.status==lateLens.UNKNOWN() && p.items.length==0,"late live index is unknown not empty");
    }
}
