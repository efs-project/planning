// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {FilesPageReaderTest} from "./FilesPageReader.t.sol";
import {FilesPageReader} from "./FilesPageReader.sol";
import {FilesRetainedLens} from "./FilesRetainedLens.sol";
import {FilesQueryAccumulator} from "./FilesQueryAccumulator.sol";
import {FilesCarrierIndex} from "./FilesCarrierProfile.sol";
import {LensReader} from "../src/LensReader.sol";

contract FilesRetainedQueryTest is FilesPageReaderTest {
    function test_retained_query_advances_across_selected_folder_churn() public {
        FilesPageReader r=new FilesPageReader(ledger,new FilesRetainedLens(ledger,index),FilesCarrierIndex(address(index)));
        bytes32 folder=_directory(1901);(bytes32 a,)=file(folder,"a",1902);(bytes32 b,)=file(folder,"b",1903);
        FilesPageReader.Query memory q;
        FilesQueryAccumulator acc=new FilesQueryAccumulator(r,folder,selectors(),q,basis(),bytes32("retained"));
        acc.step(bytes32("retained"),1);require(acc.scanned()==1&&!acc.complete(),"retained start prefix");
        bytes32 pin=acc.inventoryPin();require(pin!=0,"origin inventory lacks pin");
        ledger.bind(FOLDER,folder,name("a"),b,1);ledger.unbind(FOLDER,folder,name("b"),1);
        ledger.publish(nt,bytes("c"));ledger.bind(FOLDER,folder,name("c"),a,0);
        acc.step(bytes32("retained"),1);
        require(acc.complete()&&acc.scanned()==2&&acc.rawTotal()==2&&acc.rowCount()==2&&acc.inventoryPin()==pin,"retained origin lost removed row or scanned new suffix");
    }
    function test_retained_placement_uses_historical_higher_masks_and_origin_lengths() public {
        FilesPageReader r=new FilesPageReader(ledger,new FilesRetainedLens(ledger,index),FilesCarrierIndex(address(index)));
        bytes32 folder=_directory(2001);(bytes32 a,)=file(folder,"a",2002);(bytes32 b,)=file(folder,"b",2003);
        bytes32[] memory principals=new bytes32[](2);principals[0]=pid(address(bob));principals[1]=pid(address(this));
        FilesPageReader.Query memory q;FilesPageReader.Basis memory origin=basis();
        FilesPageReader.Page memory first=r.readPage(folder,principals,q,origin,"",1);
        bob.bind(FOLDER,folder,name("b"),a,0);
        FilesPageReader.Page memory rest=r.readPage(folder,principals,q,origin,first.continuation,8);
        require(rest.rows.length==1&&rest.rows[0].placement.target==b&&rest.rawTotal==2&&rest.inventoryPin==first.inventoryPin,"post-origin higher head masked origin placement");
        bob.unbind(FOLDER,folder,name("b"),1);origin=basis();first=r.readPage(folder,principals,q,origin,"",1);
        require(first.rows.length==0&&first.rawTotal==3,"retained tombstone candidate must be scanned");
        bob.bind(FOLDER,folder,name("b"),a,2);
        rest=r.readPage(folder,principals,q,origin,first.continuation,8);
        require(rest.rows.length==1&&rest.rows[0].placement.target==a&&rest.rawTotal==3,"historical tombstone fell through after restore");
        require(rest.prefixProbes!=0&&rest.prefixGas!=0,"prefix discovery hidden in row count");
    }
}
