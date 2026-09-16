// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Keys} from "./Keys.sol";
import {ITypeRegistry} from "./Interfaces.sol";
import {DescribedCodec,DescriptorCode,DescribedTypeRule,IDescribedRegistry} from "./DescribedTypeProfile.sol";

/// @title TypeRegistry — exact Type identity + mandatory rule + separate Realm acceptance policy (lab)
/// @notice DISPOSABLE LAB, NO PROTOCOL CLAIM. Authority repair 2026-09-13 (REPAIR.md R2, F5).
///
///         IDENTITY. A Type is its descriptor: an opaque shape commitment, the expected Type of
///         each leading checked-reference word, and the declared rule identity (the acceptor's
///         codehash at registration; 0 = no rule). The id is derived from the descriptor
///         (`Keys.typeId`), so the same descriptor is the same Type on every Realm and a changed
///         descriptor is a NEW Type. Registration under an existing id is refused: nothing about
///         a Type's identity is ever mutated in place, and a clean reader recomputes the id from
///         the retained descriptor.
///
///         MANDATORY RULE. The registration-time acceptor (address pinned here, codehash = the
///         descriptor's ruleId) is the Type's fixed predicate: the Ledger runs it on EVERY
///         publish/reuse of the Type, re-verifying its codehash, and its refusal is final. No
///         later action of this registry can remove or replace it.
///
///         POLICY. A Realm may ADD constraints: an append-only activation history per Type names
///         an additional policy acceptor that must ALSO accept (row 1, written by `register`, is
///         "no additional policy"; `activate(typeId, address(0))` returns to that — it never means
///         "no validation"). The Ledger records the policy row index per admission, and the signed
///         acceptance profile binds (typeId, ruleId, active policy codehash, epoch), so a signature
///         made before an activation is stale after it while every admission's basis stays
///         readable (`Ledger.acceptanceBasis`). Binding-role target Types are Realm placement
///         policy, not Type identity; they stay mutable and epoch-bumping.
///
///         LIMIT (coordinator, 2026-09-13): a codehash pins an acceptor's CODE, not its mutable
///         dependencies (its own storage, contracts it reads). This registry cannot tell a
///         stateless rule from a stateful one, and no self-declared "stateless" flag would prove
///         it, so none is added. Lab convention: every MANDATORY fixture rule is stateless or
///         immutable-configured (QuoteAcceptor, LabelAcceptor, MinBodyAcceptor in src/,
///         StrictQuoteAcceptor in test/ — constructor immutables are part of the runtime codehash); the
///         mutable MockAcceptor (mode/minBody, unchanged codehash) is installed only as an
///         ADDITIONAL policy through `activate`. A production mandatory rule is either stateless /
///         immutable-configured, or stateful with its dependency and basis semantics explicitly
///         declared (programmable acceptance); stateful developer rules remain allowed — pinning a
///         codehash alone simply declares nothing about them.
contract TypeRegistry is ITypeRegistry {
    /// Immutable once registered (3 slots: packed header incl. the pinned mandatory acceptor, shape, ruleId).
    struct TypeInfo {
        bool registered;
        uint8 refCount;
        uint16 activations; // policy rows so far (>= 1 once registered)
        uint64 registeredAt;
        address mandatoryAcceptor; // the declared rule's pinned instance (0 = no rule); codehash == ruleId
        bytes32 shape;
        bytes32 ruleId;
    }

    /// One policy row (2 slots: packed header, codehash). Append-only. acceptor 0 = no additional policy.
    struct Activation {
        address acceptor;
        uint48 epoch; // global rules epoch after this activation
        uint40 activatedAt; // block number
        bytes32 acceptorCodehash;
    }

    address public immutable admin;
    uint64 public epoch; // legacy register and policy/role changes, NOT described catalog additions
    mapping(bytes32 => TypeInfo) private _types;
    mapping(bytes32 => bytes32[]) private _refTypes; // typeId => expected Type per leading body word
    mapping(bytes32 => mapping(uint16 => Activation)) private _activation; // typeId => 1-based index => row
    mapping(bytes32 => mapping(bytes32 => bytes32)) private _bindingRefTypes; // purpose => role => expected Type

    address public immutable describedRule;
    uint64 public catalogRevision;
    struct Declaration {address blob;bool installed;bytes signature;}
    struct LocalBinding {address custom;address allowedLedger;bytes32 id;bytes preimage;bytes signature;}
    mapping(bytes32=>Declaration) private _declarations;
    mapping(bytes32=>LocalBinding) private _localBindings;
    bytes32 private constant DECLARATION_DOMAIN=keccak256("efs.lab.portable-type-declaration/1");
    bytes32 private constant BINDING_DOMAIN=keccak256("efs.lab.local-type-binding/1");
    uint256 private constant HALF_N=0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0;

    event TypeRegistered(bytes32 indexed typeId, bytes32 shape, bytes32 ruleId, address mandatoryAcceptor, uint8 refCount);
    event PolicyActivated(bytes32 indexed typeId, uint16 activation, address acceptor, bytes32 acceptorCodehash, uint64 epoch);
    event BindingRoleSet(bytes32 indexed purpose, bytes32 indexed role, bytes32 expectedType);

    error E_ADMIN();
    error E_TYPE_EXISTS(bytes32 typeId);
    error E_UNKNOWN_TYPE(bytes32 typeId);
    error E_ACCEPTOR_CODE();
    error E_TOO_MANY_REFS();
    error E_ACTIVATION(bytes32 typeId, uint16 index);
    error E_DECLARATION();
    error E_BINDING();
    event DeclarationRetained(bytes32 indexed typeId,address blob);
    event DescribedInstalled(bytes32 indexed typeId,bytes32 bindingId,uint64 catalogRevision);

    constructor() {
        admin = msg.sender;
        describedRule=address(new DescribedTypeRule());
    }

    function describedTypeId(bytes calldata descriptor_) public view returns(bytes32){
        DescribedCodec.Schema memory s=DescribedCodec.parse(descriptor_);
        return Keys.typeId(DescribedCodec.shape(descriptor_),s.refs,describedRule.codehash);
    }

    /// Portable EOA declaration namespace; raw digest (not personal_sign).
    /// No destination chain, registry, payer, local instance or address.
    function declarationDigest(bytes32 typeId) public pure returns(bytes32){return keccak256(abi.encode(DECLARATION_DOMAIN,typeId));}

    /// Retaining/reading meaning does not grant a destination custom installation.
    function retainDeclaration(bytes calldata descriptor_,bytes calldata signature) external returns(bytes32 typeId){
        DescribedCodec.Schema memory s=DescribedCodec.parse(descriptor_);
        typeId=Keys.typeId(DescribedCodec.shape(descriptor_),s.refs,describedRule.codehash);
        _retain(typeId,descriptor_,signature,s.key);
    }

    function _retain(bytes32 typeId,bytes calldata descriptor_,bytes calldata signature,address key) private {
        _verify(declarationDigest(typeId),signature,key);
        Declaration storage d=_declarations[typeId];
        if(d.blob!=address(0))return;
        // An admin's opaque registration remains opaque even for matching bytes.
        if(_types[typeId].registered)revert E_TYPE_EXISTS(typeId);
        d.blob=address(new DescriptorCode(descriptor_));d.signature=signature;
        emit DeclarationRetained(typeId,d.blob);
    }

    /// Atomic, permissionless, immutable installation. Local authority is the
    /// descriptor key; it can authorize any exact instance, never "same code".
    function registerDescribed(bytes calldata descriptor_,bytes calldata declaration,address custom,address allowedLedger,bytes calldata bindingSignature)
        external returns(bytes32 typeId)
    {
        DescribedCodec.Schema memory s=DescribedCodec.parse(descriptor_);
        bytes32 shape=DescribedCodec.shape(descriptor_);bytes32 rule=describedRule.codehash;
        typeId=Keys.typeId(shape,s.refs,rule);
        _retain(typeId,descriptor_,declaration,s.key);
        bytes32 bindingId;bytes memory preimage;
        if(s.customHash==0){
            if(custom!=address(0)||allowedLedger!=address(0)||bindingSignature.length!=0)revert E_BINDING();
        }else{
            if(custom.code.length==0||custom.codehash!=s.customHash||allowedLedger.code.length==0)revert E_BINDING();
            // The exact local Ledger must actually be pinned to this registry.
            bytes memory input=abi.encodeWithSignature("registry()");bool ok;uint256 size;uint256 returned;
            assembly("memory-safe"){
                let ptr:=mload(0x40)
                ok:=staticcall(15000,allowedLedger,add(input,32),mload(input),ptr,32)
                size:=returndatasize() returned:=mload(ptr)
            }
            if(!ok||size!=32||returned!=uint160(address(this)))revert E_BINDING();
            preimage=_bindingPreimage(typeId,custom,allowedLedger,s);
            bindingId=keccak256(preimage);_verify(bindingId,bindingSignature,s.key);
        }
        TypeInfo storage existing=_types[typeId];
        if(existing.registered){
            if(!_declarations[typeId].installed||_localBindings[typeId].id!=bindingId||existing.shape!=shape||existing.ruleId!=rule)revert E_BINDING();
            return typeId;
        }
        address mandatory=describedRule;
        if(bindingId!=0){
            mandatory=address(new DescribedTypeRule{salt:bindingId}());
            if(mandatory!=bindingAddress(bindingId)||mandatory.codehash!=rule)revert E_BINDING();
            _localBindings[typeId]=LocalBinding(custom,allowedLedger,bindingId,preimage,bindingSignature);
        }
        _types[typeId]=TypeInfo(true,uint8(s.refs.length),1,uint64(block.number),mandatory,shape,rule);
        _declarations[typeId].installed=true;
        _refTypes[typeId]=s.refs;
        _activation[typeId][1]=Activation(address(0),uint48(epoch),uint40(block.number),bytes32(0));
        emit TypeRegistered(typeId,shape,rule,mandatory,uint8(s.refs.length));
        emit PolicyActivated(typeId,1,address(0),bytes32(0),epoch);
        emit DescribedInstalled(typeId,bindingId,++catalogRevision);
    }

    function bindingPreimage(bytes calldata descriptor_,address custom,address allowedLedger) external view returns(bytes memory){
        DescribedCodec.Schema memory s=DescribedCodec.parse(descriptor_);
        if(s.customHash==0)revert E_BINDING();
        bytes32 t=Keys.typeId(DescribedCodec.shape(descriptor_),s.refs,describedRule.codehash);
        return _bindingPreimage(t,custom,allowedLedger,s);
    }
    function _bindingPreimage(bytes32 t,address custom,address allowedLedger,DescribedCodec.Schema memory s) private view returns(bytes memory){
        return abi.encode(BINDING_DOMAIN,DescribedCodec.PROFILE,describedRule.codehash,keccak256(type(DescribedTypeRule).creationCode),
            block.chainid,address(this),t,allowedLedger,custom,s.customHash,uint256(s.customAbi),s.key);
    }
    function bindingAddress(bytes32 id) public view returns(address){
        return address(uint160(uint256(keccak256(abi.encodePacked(hex"ff",address(this),id,keccak256(type(DescribedTypeRule).creationCode))))));
    }
    function describedInfo(bytes32 t) external view returns(IDescribedRegistry.Info memory info){
        // Retention is not interpretation/installation, in either call order.
        if(!_declarations[t].installed){info.blob=_declarations[t].blob;return info;}
        TypeInfo storage row=_types[t];LocalBinding storage b=_localBindings[t];
        return IDescribedRegistry.Info(_declarations[t].blob,row.mandatoryAcceptor,row.shape,row.ruleId,b.custom,b.allowedLedger,b.id);
    }
    /// Empty means OPAQUE_LEGACY or missing declaration, not an empty valid schema.
    function descriptorBytes(bytes32 t) external view returns(bytes memory d){
        address blob=_declarations[t].blob;if(blob==address(0))return "";
        uint256 size=blob.code.length;if(size<91||size>4097)revert E_DECLARATION();
        d=new bytes(size-1);assembly("memory-safe"){extcodecopy(blob,add(d,32),1,sub(size,1))}
    }
    function declarationSignature(bytes32 t) external view returns(bytes memory){return _declarations[t].signature;}
    /// 0 opaque/missing, 1 retained declaration only, 2 installed described Type.
    function describedStatus(bytes32 t) external view returns(uint8){
        Declaration storage d=_declarations[t];
        if(d.installed)return 2;
        return _types[t].registered||d.blob==address(0)?0:1;
    }
    function describedBinding(bytes32 t) external view returns(bytes32 id,bytes memory preimage,bytes memory signature){
        LocalBinding storage b=_localBindings[t];return(b.id,b.preimage,b.signature);
    }
    function _verify(bytes32 digest,bytes calldata signature,address key) private pure {
        if(signature.length!=65)revert E_DECLARATION();bytes32 r;bytes32 s;uint8 v;
        assembly("memory-safe"){r:=calldataload(signature.offset) s:=calldataload(add(signature.offset,32)) v:=byte(0,calldataload(add(signature.offset,64)))}
        if(uint256(s)>HALF_N||(v!=27&&v!=28)||ecrecover(digest,v,r,s)!=key)revert E_DECLARATION();
    }

    /// Register a Type by descriptor. Returns the derived exact id. Refused if that id exists
    /// (same descriptor twice); a different descriptor never collides with an existing id. The
    /// acceptor becomes the Type's MANDATORY rule; policy row 1 = no additional policy.
    function register(bytes32 shape, address acceptor, bytes32[] calldata expectedRefTypes)
        external
        returns (bytes32 typeId)
    {
        if (msg.sender != admin) revert E_ADMIN();
        if (expectedRefTypes.length > 8) revert E_TOO_MANY_REFS();
        bytes32 codehash = _codehashOf(acceptor);
        typeId = Keys.typeId(shape, expectedRefTypes, codehash);
        if (_types[typeId].registered) revert E_TYPE_EXISTS(typeId);
        _types[typeId] = TypeInfo(true, uint8(expectedRefTypes.length), 0, uint64(block.number), acceptor, shape, codehash);
        _refTypes[typeId] = expectedRefTypes;
        emit TypeRegistered(typeId, shape, codehash, acceptor, uint8(expectedRefTypes.length));
        _activate(typeId, address(0), bytes32(0));
    }

    /// Append a policy activation: from now on `acceptor` must ALSO accept every publish/reuse of
    /// `typeId` on this Realm (address(0) = no additional policy). The Type's identity and its
    /// mandatory rule are untouched; earlier admissions keep their recorded basis.
    function activate(bytes32 typeId, address acceptor) external returns (uint16 activation_) {
        if (msg.sender != admin) revert E_ADMIN();
        if (!_types[typeId].registered) revert E_UNKNOWN_TYPE(typeId);
        return _activate(typeId, acceptor, _codehashOf(acceptor));
    }

    function _activate(bytes32 typeId, address acceptor, bytes32 codehash) private returns (uint16 index) {
        TypeInfo storage t = _types[typeId];
        index = t.activations + 1;
        if (index == 0) revert E_ACTIVATION(typeId, index); // uint16 wrap
        t.activations = index;
        uint64 e = ++epoch;
        _activation[typeId][index] = Activation(acceptor, uint48(e), uint40(block.number), codehash);
        emit PolicyActivated(typeId, index, acceptor, codehash, e);
    }

    function _codehashOf(address acceptor) private view returns (bytes32 codehash) {
        if (acceptor != address(0)) {
            if (acceptor.code.length == 0) revert E_ACCEPTOR_CODE();
            codehash = acceptor.codehash;
        }
    }

    function setBindingRefType(bytes32 purpose, bytes32 role, bytes32 expectedType) external {
        if (msg.sender != admin) revert E_ADMIN();
        _bindingRefTypes[purpose][role] = expectedType;
        ++epoch;
        emit BindingRoleSet(purpose, role, expectedType);
    }

    /// The id a descriptor would get (pure derivation exposed for clients and clean readers).
    function typeIdOf(bytes32 shape, address acceptor, bytes32[] calldata expectedRefTypes) external view returns (bytes32) {
        return Keys.typeId(shape, expectedRefTypes, _codehashOf(acceptor));
    }

    /// What the Ledger reads at every admission: the mandatory rule (pinned instance + ruleId),
    /// the active policy row (acceptor + codehash; 0/0 = none) and its index, and refCount.
    function typeInfo(bytes32 typeId)
        external
        view
        returns (
            bool registered,
            address mandatoryAcceptor,
            bytes32 ruleId,
            address policyAcceptor,
            bytes32 policyCodehash,
            uint8 refCount,
            uint16 activation_
        )
    {
        TypeInfo storage t = _types[typeId];
        if (!t.registered) return (false, address(0), bytes32(0), address(0), bytes32(0), 0, 0);
        Activation storage a = _activation[typeId][t.activations];
        return (true, t.mandatoryAcceptor, t.ruleId, a.acceptor, a.acceptorCodehash, t.refCount, t.activations);
    }

    /// The immutable descriptor (identity) of a registered Type plus its pinned mandatory instance.
    function descriptor(bytes32 typeId)
        external
        view
        returns (bytes32 shape, bytes32 ruleId, address mandatoryAcceptor, uint8 refCount, uint16 activations, uint64 registeredAt)
    {
        TypeInfo storage t = _types[typeId];
        if (!t.registered) revert E_UNKNOWN_TYPE(typeId);
        return (t.shape, t.ruleId, t.mandatoryAcceptor, t.refCount, t.activations, t.registeredAt);
    }

    function activation(bytes32 typeId, uint16 index)
        external
        view
        returns (address acceptor, bytes32 acceptorCodehash, uint64 epoch_, uint64 activatedAt)
    {
        if (index == 0 || index > _types[typeId].activations) revert E_ACTIVATION(typeId, index);
        Activation storage a = _activation[typeId][index];
        return (a.acceptor, a.acceptorCodehash, a.epoch, a.activatedAt);
    }

    function refTypes(bytes32 typeId) external view returns (bytes32[] memory) {
        return _refTypes[typeId];
    }

    function bindingRefType(bytes32 purpose, bytes32 role) external view returns (bytes32) {
        return _bindingRefTypes[purpose][role];
    }
}
