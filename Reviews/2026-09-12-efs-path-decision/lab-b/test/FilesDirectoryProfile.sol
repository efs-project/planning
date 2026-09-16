// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {Ledger} from "../src/Ledger.sol";
import {Keys} from "../src/Keys.sol";
import {TypeRegistry} from "../src/TypeRegistry.sol";
import {IAcceptor} from "../src/Interfaces.sol";
import {FilesLayout} from "./FilesJoinedProfile.sol";
import {FilesLiveNamesIndex} from "./FilesLiveIndex.sol";

/// Ordinary exact application Type, not a Core noun. Identity is the immutable
/// descriptor Record; its seed is a CREATE subject, not its name or parent.
library FilesDirectoryLayout {
    bytes32 internal constant SHAPE=keccak256("lab/type/files-directory/1");
    error E_DIRECTORY_PROFILE();
    function pin(Ledger core,bytes32 directoryType,bytes32 expectedHash) internal view {
        TypeRegistry types=TypeRegistry(address(core.registry()));
        (bytes32 shape,bytes32 ruleHash,address rule,uint8 count,,)=types.descriptor(directoryType);
        bytes32[] memory refs=types.refTypes(directoryType);
        if(directoryType==0 || expectedHash==0 || shape!=SHAPE || count!=0 || refs.length!=0
            || rule.code.length==0 || ruleHash!=expectedHash || rule.codehash!=expectedHash
            || Keys.typeId(shape,refs,ruleHash)!=directoryType)revert E_DIRECTORY_PROFILE();
    }
    /// Bounded reads against the reviewed Ledger layout, including retained bytes.
    /// An occurrence withdrawal never erases or invalidates this descriptor.
    function validate(Ledger core,bytes32 directoryType,bytes32 id,uint64 through) internal view returns(bool) {
        (bytes32 t,uint64 first,uint32 length)=FilesLayout.header(core,id);
        if(t!=directoryType || first==0 || first>through || length!=32)return false;
        bytes32 seed=FilesLayout.word(core,id,0);uint64 created=core.subjectCreatedAt(seed);
        return seed!=0 && created!=0 && created<=first && Keys.record(t,abi.encode(seed))==id;
    }
}
contract FilesDirectoryRule is IAcceptor {
    function accept(bytes32,bytes calldata data,bytes32[] calldata refs) external view returns(bool) {
        if(data.length!=32 || refs.length!=0)return false;
        bytes32 seed=bytes32(data[:32]);return seed!=0 && Ledger(msg.sender).subjectCreatedAt(seed)!=0;
    }
}
/// Required from admission one. Admin detachment/replacement is a different
/// execution posture, not protection against malicious profile administration.
contract FilesDirectoryIndex is FilesLiveNamesIndex {
    bytes32 private constant FOLDER=keccak256("efs2/purpose/folder/1");
    bytes32 public immutable directoryType;
    bytes32 public immutable expectedDirectoryRuleHash;
    error E_DIRECTORY_PARENT(bytes32 parent);
    error E_DIRECTORY_TARGET(bytes32 target);
    error E_DIRECTORY_SELF_LINK();
    function _manifestExtension() internal view virtual override returns(bytes32){
        return keccak256(abi.encode(super._manifestExtension(),"FilesDirectory/1:final-retained-parent-target",directoryType,expectedDirectoryRuleHash));
    }
    constructor(address c,bytes32 rt,bytes32 ct,bytes32 rh,bytes32 ch,bytes32 nt,bytes32 nh,bytes32 dt,bytes32 dh)
        FilesLiveNamesIndex(c,rt,ct,rh,ch,nt,nh) {
        FilesDirectoryLayout.pin(Ledger(c),dt,dh);directoryType=dt;expectedDirectoryRuleHash=dh;
    }
    function afterPublication(uint64 publication,Effect[] calldata effects) public view virtual override returns(bytes4 acknowledgement) {
        acknowledgement=super.afterPublication(publication,effects);
        Ledger core=Ledger(ledger);FilesDirectoryLayout.pin(core,directoryType,expectedDirectoryRuleHash);
        uint64 through=effects[effects.length-1].admission;
        for(uint256 i;i<effects.length;i++) {
            Effect calldata e=effects[i];if(e.kind!=3)continue;
            (bytes32 p,bytes32 parent,)=core.positionCell(core.bindingPosition(e.bindingOrdinal));
            if(p!=FOLDER)continue;
            if(!FilesDirectoryLayout.validate(core,directoryType,parent,through))revert E_DIRECTORY_PARENT(parent);
            uint64 created=core.subjectCreatedAt(e.target);
            if(created!=0 && created<=through)continue; // File subject, HEAD assessed separately by its Lens.
            if(!FilesDirectoryLayout.validate(core,directoryType,e.target,through))revert E_DIRECTORY_TARGET(e.target);
            if(parent==e.target)revert E_DIRECTORY_SELF_LINK();
        }
    }
}
