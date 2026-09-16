// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {Ledger} from "../src/Ledger.sol";
import {Keys} from "../src/Keys.sol";
import {IIndexModule} from "../src/Interfaces.sol";
import {FilesNameLayout} from "./FilesNamesProfile.sol";
import {FilesDirectoryLayout} from "./FilesDirectoryProfile.sol";

/// Stateless complete final Name/Directory unit. Explicit constructor-bound
/// Ledger, never msg.sender inference. This endpoint is NOT an index ACK.
contract FilesFinalValidator {
    Ledger public immutable ledger;
    bytes32 public immutable nameType;
    bytes32 public immutable nameHash;
    bytes32 public immutable directoryType;
    bytes32 public immutable directoryHash;
    bytes4 public constant VALID = bytes4(keccak256("FilesFinalValidator/1/valid"));
    error E_NAME_REQUIRED(bytes32 position,bytes32 nameRecord);
    error E_DIRECTORY_PARENT(bytes32 parent);
    error E_DIRECTORY_TARGET(bytes32 target);
    error E_DIRECTORY_SELF_LINK();
    constructor(address c,bytes32 nt,bytes32 nh,bytes32 dt,bytes32 dh){
        ledger=Ledger(c);nameType=nt;nameHash=nh;directoryType=dt;directoryHash=dh;
        FilesNameLayout.pin(ledger,nt,nh);FilesDirectoryLayout.pin(ledger,dt,dh);
    }
    function validate(IIndexModule.Effect[] calldata effects) external view returns(bytes4){
        Ledger core=ledger;FilesNameLayout.pin(core,nameType,nameHash);
        uint64 through=effects[effects.length-1].admission;
        // Preserve the full Name pass before the full Directory pass, including
        // terminal-admission semantics for bind-before-publish and replay.
        for(uint256 i;i<effects.length;++i){
            IIndexModule.Effect calldata e=effects[i];if(e.kind!=3)continue;
            bytes32 position=core.bindingPosition(e.bindingOrdinal);
            (bytes32 purpose,bytes32 folder,bytes32 role)=core.positionCell(position);
            if(purpose!=FilesNameLayout.FOLDER)continue;
            bytes32 id=Keys.recordFromHash(nameType,role);
            (uint8 status,bytes32 t,uint64 first,bytes memory value)=FilesNameLayout.load(address(core),id);
            if(position!=Keys.position(purpose,folder,role)||e.bindingKey!=Keys.binding(e.author,position)
                ||e.scopeKey!=Keys.scope(e.author,purpose,folder)||status!=1||t!=nameType||first==0||first>through
                ||!FilesNameLayout.valid(value)||keccak256(value)!=role||Keys.recordFromHash(t,keccak256(value))!=id)
                revert E_NAME_REQUIRED(position,id);
        }
        FilesDirectoryLayout.pin(core,directoryType,directoryHash);
        for(uint256 i;i<effects.length;++i){
            IIndexModule.Effect calldata e=effects[i];if(e.kind!=3)continue;
            (bytes32 purpose,bytes32 parent,)=core.positionCell(core.bindingPosition(e.bindingOrdinal));
            if(purpose!=FilesNameLayout.FOLDER)continue;
            if(!FilesDirectoryLayout.validate(core,directoryType,parent,through))revert E_DIRECTORY_PARENT(parent);
            uint64 created=core.subjectCreatedAt(e.target);
            if(created!=0&&created<=through)continue;
            if(!FilesDirectoryLayout.validate(core,directoryType,e.target,through))revert E_DIRECTORY_TARGET(e.target);
            if(parent==e.target)revert E_DIRECTORY_SELF_LINK();
        }
        return VALID;
    }
}
