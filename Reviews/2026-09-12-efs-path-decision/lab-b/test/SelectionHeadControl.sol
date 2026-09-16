// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {Ledger} from "../src/Ledger.sol";
import {IndexModule} from "../src/IndexModule.sol";
import {FilesLiveLens} from "./FilesLiveIndex.sol";

/// Test-only same-guarantee paid control; never a production mode switch.
contract RawHeadFilesLiveLens is FilesLiveLens {
    constructor(Ledger c,IndexModule i) FilesLiveLens(c,i) {}
    function _selectionHead(bytes32 key) internal view override returns(uint8 state,uint32 revision,uint64 admissionOrdinal,bytes32 target) {
        (state,revision,admissionOrdinal,,,target)=ledger.head(key);
        if(state!=1)target=0;
    }
}
