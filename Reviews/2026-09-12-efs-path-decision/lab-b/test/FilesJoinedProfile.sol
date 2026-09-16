// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Ledger} from "../src/Ledger.sol";
import {IAcceptor} from "../src/Interfaces.sol";
import {Keys} from "../src/Keys.sol";
import {IndexModule} from "../src/IndexModule.sol";
import {TypeRegistry} from "../src/TypeRegistry.sol";

/// Disposable Files profile, not a production grammar or portable source proof.
library FilesLayout {
    bytes32 internal constant ROOT_SHAPE = keccak256("lab/type/files-joined-root/1");
    bytes32 internal constant CHILD_SHAPE = keccak256("lab/type/files-joined-child/1");

    // Coupled only to pinned Ledger slots 2/3. No full parent body read.
    function recordBase(bytes32 id) internal pure returns (bytes32) {
        return keccak256(abi.encode(id, uint256(2)));
    }

    function header(Ledger core, bytes32 id) internal view returns (bytes32 t, uint64 first, uint32 length) {
        bytes32 base = recordBase(id);
        uint256 meta = uint256(core.extsload(bytes32(uint256(base) + 1)));
        return (core.extsload(base), uint64(meta & ((uint256(1) << 48) - 1)), uint32(meta >> 48));
    }

    function word(Ledger core, bytes32 id, uint256 i) internal view returns (bytes32) {
        return core.extsload(keccak256(abi.encode(i, keccak256(abi.encode(id, uint256(3))))));
    }
}

contract FilesRootRule is IAcceptor {
    function accept(bytes32, bytes calldata data, bytes32[] calldata refs) external view returns (bool) {
        if (data.length < 32 || refs.length != 0) return false;
        bytes32 file = bytes32(data[:32]);
        return file != bytes32(0) && Ledger(msg.sender).subjectCreatedAt(file) != 0;
    }
}

contract FilesChildRule is IAcceptor {
    bytes32 public immutable rootType;

    constructor(bytes32 rootType_) { rootType = rootType_; }

    function accept(bytes32 incomingType, bytes calldata data, bytes32[] calldata refs) external view returns (bool) {
        if (rootType == bytes32(0) || data.length < 64 || refs.length != 1) return false;
        bytes32 parent = bytes32(data[:32]);
        bytes32 file = bytes32(data[32:64]);
        Ledger core = Ledger(msg.sender);
        if (parent != refs[0] || file == bytes32(0) || core.subjectCreatedAt(file) == 0) return false;
        (bytes32 parentType, uint64 first, uint32 length) = FilesLayout.header(core, parent);
        if (first == 0) return false;
        if (parentType == rootType) return length >= 32 && FilesLayout.word(core, parent, 0) == file;
        if (parentType == incomingType) return length >= 64 && FilesLayout.word(core, parent, 1) == file;
        return false;
    }
}

/// Exact disposable profile. Expected hashes are an independently configured
/// trust boundary: callers pin reviewed deployed rules, not registry claims.
contract FilesParentIndex is IndexModule {
    bytes32 public constant FAMILY_FILES_PARENT = keccak256("efs2/family/files-parent/1");
    bytes32 public immutable rootType;
    bytes32 public immutable childType;
    bytes32 public immutable expectedRootRuleHash;
    bytes32 public immutable expectedChildRuleHash;

    error E_FILES_PROFILE();
    error E_FILES_RECORD();

    function _extensionEntry(bytes32 f) internal view virtual override returns(ManifestEntry memory){
        if(f==FAMILY_FILES_PARENT)return ManifestEntry(f,11,2,2,keccak256("childType,11,0,parent:alias-of-generic-ref"),true);
        return super._extensionEntry(f);
    }
    function _manifestExtension() internal view virtual override returns(bytes32){
        return keccak256(abi.encode("FilesParent/1",rootType,childType,expectedRootRuleHash,expectedChildRuleHash));
    }

    constructor(address ledger_, bytes32 rootType_, bytes32 childType_, bytes32 rootHash_, bytes32 childHash_)
        IndexModule(ledger_)
    {
        TypeRegistry types = TypeRegistry(address(Ledger(ledger_).registry()));
        _checkDescriptor(types, rootType_, FilesLayout.ROOT_SHAPE, rootHash_, false);
        address childRule = _checkDescriptor(types, childType_, FilesLayout.CHILD_SHAPE, childHash_, true);
        if (FilesChildRule(childRule).rootType() != rootType_) revert E_FILES_PROFILE();
        rootType = rootType_;
        childType = childType_;
        expectedRootRuleHash = rootHash_;
        expectedChildRuleHash = childHash_;
        _declare(FAMILY_FILES_PARENT, true, attachedFrom);
    }

    function _checkDescriptor(TypeRegistry types, bytes32 t, bytes32 expectedShape, bytes32 expectedHash, bool child)
        private view returns (address rule)
    {
        (bytes32 shape, bytes32 ruleHash, address mandatory, uint8 count,,) = types.descriptor(t);
        bytes32[] memory refs = types.refTypes(t);
        uint256 expectedCount = child ? 1 : 0;
        if (t == 0 || expectedHash == 0 || mandatory.code.length == 0 || shape != expectedShape
            || ruleHash != expectedHash || mandatory.codehash != expectedHash || count != expectedCount
            || refs.length != expectedCount || (child && refs[0] != 0)
            || Keys.typeId(shape, refs, ruleHash) != t) revert E_FILES_PROFILE();
        return mandatory;
    }

    function _foldEffect(Effect memory e) internal virtual override {
        super._foldEffect(e);
        Ledger core = Ledger(ledger);
            if ((e.kind != 1 && e.kind != 2) || e.typeId != childType) return;
            (bytes32 t, uint64 first, uint32 length) = FilesLayout.header(core, e.recordId);
            if (t != childType || length < 64 || first == 0 || first > e.admission) revert E_FILES_RECORD();
    }
}

/// Immutable fault: reject every first attempted Child callback, after all
/// inherited and parent maintenance. Its transaction must erase both halves.
contract FilesFailingParentIndex is FilesParentIndex {
    error E_FORCED_CHILD();

    constructor(address ledger_, bytes32 rootType_, bytes32 childType_, bytes32 rootHash_, bytes32 childHash_)
        FilesParentIndex(ledger_, rootType_, childType_, rootHash_, childHash_) {}

    function onAdmission(uint64 publication, Effect[] calldata effects) public override {
        super.onAdmission(publication, effects);
        for (uint256 i; i < effects.length; ++i) {
            if ((effects[i].kind == 1 || effects[i].kind == 2) && effects[i].typeId == childType) revert E_FORCED_CHILD();
        }
    }
}
