// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {LabBase} from "./LabBase.sol";
import {Ledger} from "../src/Ledger.sol";
import {IndexModule} from "../src/IndexModule.sol";
import {LensReader} from "../src/LensReader.sol";
import {Keys} from "../src/Keys.sol";

contract LensReviewTest is LabBase {
    function principals() private view returns (bytes32[] memory p) {
        p = new bytes32[](2); p[0] = pid(address(alice)); p[1] = pid(address(bob));
    }
    function populate() private returns (bytes32 file) {
        file = alice.create(bytes32("a"));
        alice.bind(FOLDER,DRAFTS,name("a"),file,0);
    }
    function foreignReader() private returns (LensReader bad) {
        populate();
        Ledger other = new Ledger(registry,REALM);
        IndexModule foreignIndex = new IndexModule(address(other));
        other.setIndexModule(address(foreignIndex));
        ledger.setIndexModule(address(foreignIndex));
        bad = new LensReader(ledger,foreignIndex);
    }
    function testQualifiedListRejectsOtherLedgersCompleteEmptyIndex() public {
        LensReader bad = foreignReader();
        LensReader.PrincipalCursor memory fresh;
        (bool ok,bytes memory err) = address(bad).staticcall(abi.encodeCall(bad.listPrincipals,(principals(),FOLDER,DRAFTS,fresh,32)));
        require(!ok && sel(err) == LensReader.E_CURSOR.selector,"foreign index fabricated complete empty list");
    }
    function testQualifiedHistoryRejectsOtherLedgersCompleteEmptyIndex() public {
        LensReader bad = foreignReader();
        (bool ok,bytes memory err) = address(bad).staticcall(abi.encodeCall(bad.historyPrincipalAt,
            (pid(address(alice)),Keys.position(FOLDER,DRAFTS,name("a")),admissions(),ledger.executionSet())));
        require(!ok && sel(err) == LensReader.E_CURSOR.selector,"foreign index fabricated absent history");
    }
    function testQualifiedOwnershipValidDetachedAndZeroIndexControls() public {
        bytes32 file = populate();
        LensReader.PrincipalCursor memory fresh;
        LensReader.PrincipalPage memory page = lens.listPrincipals(principals(),FOLDER,DRAFTS,fresh,32);
        require(page.status == 2 && page.items.length == 1 && page.items[0].target == file,"valid attachment lost live file");
        (uint8 status,bool live,bytes32 target,,) = lens.historyPrincipalAt(pid(address(alice)),Keys.position(FOLDER,DRAFTS,name("a")),2,ledger.executionSet());
        require(status == 2 && live && target == file,"valid attachment lost history");
        ledger.setIndexModule(address(0));
        (bool ok,bytes memory err) = address(lens).staticcall(abi.encodeCall(lens.listPrincipals,(principals(),FOLDER,DRAFTS,fresh,32)));
        require(!ok && sel(err) == LensReader.E_CURSOR.selector,"detached list accepted");
        (ok,err) = address(lens).staticcall(abi.encodeCall(lens.historyPrincipalAt,
            (pid(address(alice)),Keys.position(FOLDER,DRAFTS,name("a")),2,ledger.executionSet())));
        require(!ok && sel(err) == LensReader.E_CURSOR.selector,"detached history accepted");
        LensReader absent = new LensReader(ledger,IndexModule(address(0)));
        page = absent.listPrincipals(principals(),FOLDER,DRAFTS,fresh,32);
        require(page.status == 0 && page.items.length == 0,"zero index must remain unknown");
        (status,live,target,,) = absent.historyPrincipalAt(pid(address(alice)),Keys.position(FOLDER,DRAFTS,name("a")),2,ledger.executionSet());
        require(status == 0 && !live && target == 0,"zero history index must remain unknown");
    }
    function testZeroExecutionRejectsEveryNoncanonicalFirstCursorField() public {
        populate();
        for (uint256 i; i < 9; ++i) {
            LensReader.PrincipalCursor memory c;
            if (i == 0) c.basisAdmission = 1;
            else if (i == 1) c.indexGeneration = 1;
            else if (i == 2) c.rulesEpoch = 1;
            else if (i == 3) c.scopeKey = bytes32(uint256(1));
            else if (i == 4) c.lensHash = bytes32(uint256(1));
            else if (i == 5) c.position = bytes32(uint256(1));
            else if (i == 6) c.lensIndex = 2;
            else if (i == 7) c.rawIndex = 1;
            else c.selectedSoFar = 7;
            (bool ok,bytes memory err) = address(lens).staticcall(abi.encodeCall(lens.listPrincipals,(principals(),FOLDER,DRAFTS,c,32)));
            require(!ok && sel(err) == LensReader.E_CURSOR.selector,"noncanonical first cursor skipped or inherited work");
        }
    }
    function testAddressAndPrincipalSelectionMaskConflictAndPagingParity() public {
        bytes32 a = alice.create(bytes32("a")); bytes32 b = bob.create(bytes32("b"));
        alice.bind(FOLDER,DRAFTS,name("shared"),a,0); bob.bind(FOLDER,DRAFTS,name("shared"),b,0);
        alice.bind(FOLDER,DRAFTS,name("masked"),a,0); bob.bind(FOLDER,DRAFTS,name("masked"),b,0);
        alice.unbind(FOLDER,DRAFTS,name("masked"),1);
        alice.bind(FOLDER,DRAFTS,name("only-a"),a,0); bob.bind(FOLDER,DRAFTS,name("only-b"),b,0);
        pointParity(name("shared"),1,a,1,2);
        pointParity(name("masked"),2,0,2,1);
        LensReader.Cursor memory old; LensReader.PrincipalCursor memory current;
        (LensReader.Page memory op,LensReader.PrincipalPage memory np) = pageParity(lens,old,current,0);
        require(np.status == 1 && np.scanned == 0 && np.rawTotal == 6 && np.selectedSoFar == 0,"zero budget consumed candidates");
        old = op.next; current = np.next;
        for (uint256 i; i < 6; ++i) {
            (op,np) = pageParity(lens,old,current,1);
            require(np.scanned == 1,"one candidate per page");
            old = op.next; current = np.next;
        }
        require(np.status == 2 && np.selectedSoFar == 3,"mask reducer failed exact final count");
        (op,np) = pageParity(lens,old,current,1);
        require(np.status == 2 && np.scanned == 0 && np.items.length == 0,"ended continuation repeated items");
    }
    function testAddressAndPrincipalUnknownCoverageParity() public {
        populate();
        IndexModule late = new IndexModule(address(ledger)); ledger.setIndexModule(address(late));
        LensReader reader = new LensReader(ledger,late);
        LensReader.Cursor memory old; LensReader.PrincipalCursor memory current;
        (,LensReader.PrincipalPage memory page) = pageParity(reader,old,current,32);
        require(page.status == 0 && page.items.length == 0,"late attachment claimed complete");
        ledger.setIndexModule(address(0)); reader = new LensReader(ledger,IndexModule(address(0)));
        (,page) = pageParity(reader,old,current,32);
        require(page.status == 0 && page.items.length == 0,"missing index claimed complete");
    }
    function testExplicitAdmissionPinRemainsStricterThanLegacyAuditCursor() public {
        bytes32 file = populate(); alice.bind(FOLDER,DRAFTS,name("b"),file,0);
        LensReader.Cursor memory old; LensReader.PrincipalCursor memory current;
        (LensReader.Page memory op,LensReader.PrincipalPage memory np) = pageParity(lens,old,current,1);
        bob.create(bytes32("unrelated"));
        op = lens.list(lensOf(address(alice),address(bob)),FOLDER,DRAFTS,op.next,1);
        require(op.status == 2 && op.items.length == 1,"legacy audit continuation semantics changed");
        (bool ok,bytes memory err) = address(lens).staticcall(abi.encodeCall(lens.listPrincipals,(principals(),FOLDER,DRAFTS,np.next,1)));
        require(!ok && sel(err) == LensReader.E_CURSOR.selector,"V2 admission pin weakened");
    }
    function pointParity(bytes32 role,uint8 want,bytes32 target,uint32 revision,uint256 conflicts) private view {
        address[] memory authors = lensOf(address(alice),address(bob)); bytes32[] memory p = principals();
        (uint8 os,bytes32 ot,uint32 orv,address oa,uint64 oat) = lens.resolve(authors,FOLDER,DRAFTS,role);
        (uint8 ns,bytes32 nt,uint32 nrv,bytes32 na,uint64 nat) = lens.resolvePrincipals(p,FOLDER,DRAFTS,role,ledger.executionSet());
        require(os == want && ot == target && orv == revision && oa == address(alice),"point literal expectation");
        require(ns == os && nt == ot && nrv == orv && na == p[0] && nat == oat,"point wrapper parity");
        LensReader.Entry[] memory oc; LensReader.PrincipalEntry[] memory nc;
        (os,oc) = lens.resolveNoTiebreak(authors,FOLDER,DRAFTS,role);
        (ns,nc) = lens.resolveNoTiebreakPrincipals(p,FOLDER,DRAFTS,role,ledger.executionSet());
        require(os == 3 && ns == 3 && oc.length == conflicts && nc.length == conflicts,"conflict must expose all live candidates");
        for (uint256 i; i < nc.length; ++i) require(oc[i].target == nc[i].target && oc[i].revision == nc[i].revision
            && oc[i].admission == nc[i].admission && pid(oc[i].author) == nc[i].principalId,"conflict wrapper parity");
    }
    function pageParity(LensReader reader,LensReader.Cursor memory old,LensReader.PrincipalCursor memory current,uint256 budget)
        private view returns (LensReader.Page memory op,LensReader.PrincipalPage memory np)
    {
        op = reader.list(lensOf(address(alice),address(bob)),FOLDER,DRAFTS,old,budget);
        np = reader.listPrincipals(principals(),FOLDER,DRAFTS,current,budget);
        require(op.status == np.status && op.scanned == np.scanned && op.hydrations == np.hydrations && op.rawTotal == np.rawTotal
            && op.selectedSoFar == np.selectedSoFar && op.mutated == np.mutated && op.items.length == np.items.length,"page stats parity");
        for (uint256 i; i < op.items.length; ++i) require(op.items[i].position == np.items[i].position && op.items[i].target == np.items[i].target
            && op.items[i].revision == np.items[i].revision && op.items[i].admission == np.items[i].admission
            && pid(op.items[i].author) == np.items[i].principalId,"page selected entry parity");
        require(op.next.basisAdmission == np.next.basisAdmission && op.next.position == np.next.position && op.next.lensIndex == np.next.lensIndex
            && op.next.rawIndex == np.next.rawIndex && op.next.selectedSoFar == np.next.selectedSoFar,"traversal parity");
    }
}
