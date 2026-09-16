// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {IIndexModule, ITypeRegistry,IIndexReadiness,IndexReadinessProfile} from "./Interfaces.sol";
import {ExecutionSlots} from "./ExecutionSlots.sol";
import {IndexReplaySource} from "./IndexReplaySource.sol";
import {IndexWork} from "./IndexWork.sol";
import {IndexFieldProfile} from "./IndexFieldProfile.sol";
import {Keys} from "./Keys.sol";
import {PublicationPreparation as P} from "./PublicationPreparation.sol";

/// Fixed, constructor-created stateless dispatch dependency. Ledger alone selects
/// this immutable DELEGATECALL target; module is only a CALL/STATICCALL recipient.
/// Owns no storage and cannot delegate to a caller-supplied address.
contract PublicationSupport {
    error E_INDEX(bytes data);
    error E_GAS();
    error E_INDEX_RETURNDATA(uint256 size);
    error E_READSET_SHAPE();
    error E_BOUNDS(uint256 code);
    error E_REPLACEMENT();
    error E_INTENT(uint256 code);
    error E_READSET_STALE(uint256 positionIndex,uint256 principalIndex);
    error E_LEGACY_UNSUPPORTED();
    error E_EXPIRED(uint64 deadline);
    error E_SIGNATURE();
    error E_SOURCE_SIGNATURE();
    error E_SOURCE_UNSUPPORTED();
    error E_DESTINATION_AUTH();
    error E_UNKNOWN_TYPE(bytes32 typeId);

    uint256 private constant SECP256K1_N_HALF = 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0;
    bytes32 private constant LEGACY_TYPE = keccak256("PublicationIntent(bytes32 realmId,bytes32 coreCodeCommitment,address author,uint64 nonce,uint64 deadline,bytes32 acceptanceProfile,bytes32 indexObligations,bytes32 actionsHash)");
    bytes32 private constant GUARDED_TYPE = keccak256("IntentV2(bytes32 realmId,bytes32 realmOrigin,bytes32 executionSet,address author,uint64 nonce,uint64 deadline,bytes32 acceptanceProfile,bytes32 indexObligations,bytes32 readSetHash,bytes32 actionsHash)");

    struct ReadSet {bytes32[] principalIds;bytes32[] positions;bytes32[] expectedHeads;}

    // Preparation is entered only by Ledger's pinned typed DELEGATECALL. Thus
    // address(this) is the canonical Ledger/proxy and msg.sender the actual
    // caller, including for future caller-sensitive STATICCALL authorization.
    // No preparation path writes storage or calls a mutable external operation.
    function prepareNative(uint64 nonce, bytes calldata actions) external view returns (P.Result memory) {
        return _native(nonce, actions);
    }

    function _native(uint64 nonce, bytes calldata actions) private view returns (P.Result memory p) {
        _boundActions(actions);
        p.author = msg.sender;
        p.author32 = Keys.principalFor(msg.sender, _sourceWord("realmOrigin()"));
        p.creator = p.author32;
        p.proofKind = 1;
        p.nonce = nonce;
        _profiles(p, actions);
        p.actionsHash = keccak256(actions);
    }

    function prepareSigned(P.Intent calldata intent, bytes calldata actions, bytes calldata sig)
        external view returns (P.Result memory p)
    {
        _directOnly();
        if (intent.realmId != _sourceWord("realmId()")) revert E_INTENT(1);
        if (intent.coreCodeCommitment != address(this).codehash) revert E_INTENT(2);
        if (block.timestamp > intent.deadline) revert E_EXPIRED(intent.deadline);
        _boundActions(actions);
        p.author = intent.author;
        p.author32 = Keys.principal(intent.author);
        p.creator = p.author32;
        p.proofKind = 2;
        p.nonce = intent.nonce;
        p.deadline = intent.deadline;
        p.acceptanceProfile = acceptanceProfile(_registry(), actions);
        if (intent.acceptanceProfile != p.acceptanceProfile) revert E_INTENT(3);
        p.indexObligations = indexObligations(_module());
        if (intent.indexObligations != p.indexObligations) revert E_INTENT(4);
        p.actionsHash = keccak256(actions);
        _signature(p, sig, _legacyHash(intent, p.actionsHash));
    }

    function prepareGuardedNative(uint64 nonce, bytes32 expectedExecution, bytes calldata actions, bytes calldata encodedReads)
        external view returns (P.Result memory p)
    {
        p = _native(nonce, actions);
        // Native ingress formerly hashed/shape-checked the preimage before its
        // execution comparison. Decode it once and keep that refusal order.
        ReadSet memory rs = _readSet(encodedReads);
        bytes32 readHash = _readSetHash(rs);
        p.execution = _sourceWord("executionSet()");
        if (expectedExecution != p.execution) revert E_INTENT(2);
        P.IntentV2 memory intent = P.IntentV2(_sourceWord("realmId()"), _sourceWord("realmOrigin()"),
            expectedExecution, msg.sender, nonce, 0, p.acceptanceProfile, p.indexObligations, readHash);
        _finishGuarded(p, intent, rs);
    }

    function prepareGuardedSigned(P.IntentV2 calldata intent, bytes calldata actions, bytes calldata encodedReads, bytes calldata sig)
        external view returns (P.Result memory p)
    {
        if (block.timestamp > intent.deadline) revert E_EXPIRED(intent.deadline);
        if (intent.realmId != _sourceWord("realmId()") || intent.realmOrigin != _sourceWord("realmOrigin()")) revert E_INTENT(1);
        p.execution = _sourceWord("executionSet()");
        if (intent.executionSet != p.execution) revert E_INTENT(2);
        _boundActions(actions);
        p.acceptanceProfile = acceptanceProfile(_registry(), actions);
        if (intent.acceptanceProfile != p.acceptanceProfile) revert E_INTENT(3);
        p.indexObligations = indexObligations(_module());
        if (intent.indexObligations != p.indexObligations) revert E_INTENT(4);
        p.author = intent.author;
        p.author32 = Keys.principal(intent.author);
        p.creator = p.author32;
        p.proofKind = 2;
        p.nonce = intent.nonce;
        p.deadline = intent.deadline;
        p.actionsHash = keccak256(actions);
        _finishGuarded(p, intent, _readSet(encodedReads));
        _signature(p, sig, p.intentHash);
    }

    function _finishGuarded(P.Result memory p, P.IntentV2 memory intent, ReadSet memory rs) private view {
        p.readsHash = _checkedReadSet(rs, intent.readSetHash, address(this));
        p.intentHash = keccak256(abi.encodePacked(hex"1901", _sourceWord("guardedDomainSeparator()"),
            keccak256(abi.encode(GUARDED_TYPE, intent, p.actionsHash))));
        p.format = 2;
    }

    function prepareImport(P.SourceEvidence calldata src, bytes calldata actions, P.Intent calldata dst, bytes calldata dstSig)
        external view returns (P.Result memory p)
    {
        _directOnly();
        _boundActions(actions);
        bytes32 hash = keccak256(actions);
        if (src.v == 0) revert E_SOURCE_UNSUPPORTED();
        if (uint256(src.s) > SECP256K1_N_HALF || (src.v != 27 && src.v != 28)) revert E_SOURCE_SIGNATURE();
        P.Intent memory source = P.Intent(src.realmId, src.coreCodeCommitment, src.author, src.nonce,
            src.deadline, src.acceptanceProfile, src.indexObligations);
        address signer = ecrecover(_legacyHash(source, hash), src.v, src.r, src.s);
        if (signer == address(0) || signer != src.author || src.sourcePrincipal != Keys.principal(src.author)) revert E_SOURCE_SIGNATURE();
        p.author = src.author;
        p.imported = true;
        p.creator = src.sourcePrincipal;
        _profiles(p, actions);
        p.actionsHash = hash;
        if (dstSig.length == 0) {
            if (msg.sender != src.author) revert E_DESTINATION_AUTH();
            p.author32 = Keys.principalFor(msg.sender, _sourceWord("realmOrigin()"));
            p.proofKind = 1;
            p.nonce = uint64(uint256(_fixedRead(address(this), abi.encodeWithSignature("nonces(address)", msg.sender), 30_000)));
        } else {
            if (dst.author != src.author || dst.realmId != _sourceWord("realmId()") || dst.coreCodeCommitment != address(this).codehash) revert E_DESTINATION_AUTH();
            if (block.timestamp > dst.deadline) revert E_EXPIRED(dst.deadline);
            if (dst.acceptanceProfile != p.acceptanceProfile || dst.indexObligations != p.indexObligations) revert E_DESTINATION_AUTH();
            p.author32 = Keys.principal(dst.author);
            p.proofKind = 2;
            p.nonce = dst.nonce;
            p.deadline = dst.deadline;
            _signature(p, dstSig, _legacyHash(dst, hash));
        }
    }

    function _signature(P.Result memory p, bytes calldata sig, bytes32 digest) private pure {
        if (sig.length != 65) revert E_SIGNATURE();
        bytes32 r; bytes32 s; uint8 v;
        assembly ("memory-safe") { r := calldataload(sig.offset) s := calldataload(add(sig.offset, 32)) v := byte(0, calldataload(add(sig.offset, 64))) }
        if (uint256(s) > SECP256K1_N_HALF || (v != 27 && v != 28)) revert E_SIGNATURE();
        address signer = ecrecover(digest, v, r, s);
        if (signer == address(0) || signer != p.author) revert E_SIGNATURE();
        p.r = r; p.s = s; p.v = v;
    }

    function _legacyHash(P.Intent memory intent, bytes32 hash) private view returns (bytes32) {
        return keccak256(abi.encodePacked(hex"1901", _sourceWord("domainSeparator()"), keccak256(abi.encode(LEGACY_TYPE, intent, hash))));
    }
    function _directOnly() private view {
        if (uint256(_sourceWord("implementationSelf()")) != uint160(address(this))) revert E_LEGACY_UNSUPPORTED();
    }
    function _registry() private view returns (address) { return address(uint160(uint256(_sourceWord("registry()")))); }
    function _module() private view returns (address) { return address(uint160(uint256(_sourceWord("indexModule()")))); }
    function _sourceWord(string memory signature) private view returns (bytes32) {
        return _fixedRead(address(this), abi.encodeWithSignature(signature), 100_000);
    }
    function _profiles(P.Result memory p, bytes calldata actions) private view {
        p.acceptanceProfile = acceptanceProfile(_registry(), actions);
        p.indexObligations = indexObligations(_module());
    }
    function _boundActions(bytes calldata encoded) private pure {
        // Admission-only early resource refusal; the public profile getter can
        // still hash oversized candidates. No dynamic action decode is needed.
        if (encoded.length < 352 || encoded.length > 18_496) revert E_BOUNDS(0);
        uint256 offset; uint256 n;
        assembly ("memory-safe") { offset := calldataload(encoded.offset) n := calldataload(add(encoded.offset, 32)) }
        if (offset != 32 || n == 0 || n > 64 || encoded.length != 64 + n * 288) revert E_BOUNDS(0);
    }

    /// Fixed static-word EIP712 codecs, with no nested dynamic byte wrapper.
    /// Domain/type/intent/actions are supplied by the typed Ledger serializer.
    /// Public digest getters remain on this bounded read-only path.
    function legacyDigest(bytes32,bytes32,bytes32[7] calldata,bytes32) external pure returns(bytes32){return _intentDigest(288);}
    function guardedDigest(bytes32,bytes32,bytes32[9] calldata,bytes32) external pure returns(bytes32){return _intentDigest(352);}
    function _intentDigest(uint256 length) private pure returns(bytes32){
        bytes32 domain;bytes32 structHash;
        assembly("memory-safe"){
            domain:=calldataload(4)
            let ptr:=mload(0x40)
            calldatacopy(ptr,36,length)
            structHash:=keccak256(ptr,length)
        }
        return keccak256(abi.encodePacked(hex"1901",domain,structHash));
    }

    function checkReplacement(IIndexReadiness.ReplacementRequest calldata r) external view returns(bytes32){
        if(r.replacement==address(0)||r.replacement==r.expectedOld||r.replacement.code.length==0
            ||r.replacement.codehash!=r.expectedReplacementCodehash||r.requiredManifest==0)revert E_REPLACEMENT();
        if(_fixedRead(msg.sender,abi.encodeWithSignature("layoutId()"),30_000)!=IndexReplaySource.LAYOUT)revert E_REPLACEMENT();
        if(uint256(_fixedRead(msg.sender,abi.encodeWithSignature("indexModule()"),30_000))!=uint160(r.expectedOld)
            ||_fixedRead(msg.sender,abi.encodeWithSignature("extsload(bytes32)",ExecutionSlots.PUBLICATION_ACTIVE),30_000)!=0)revert E_REPLACEMENT();
        (uint64 a,,,uint64 p)=abi.decode(_fixedBytes(msg.sender,abi.encodeWithSignature("counts()"),30_000,128),(uint64,uint64,uint64,uint64));
        if(a!=r.expectedAdmission||p!=r.expectedPublication)revert E_REPLACEMENT();
        IIndexReadiness.Ready memory ready=abi.decode(_fixedBytes(r.replacement,abi.encodeCall(IIndexReadiness.replayReadiness,()),100_000,320),(IIndexReadiness.Ready));
        if(ready.sourceLedger!=msg.sender
            ||(ready.physicalProfile!=IndexReadinessProfile.PHYSICAL&&ready.physicalProfile!=IndexReadinessProfile.FILES_SPLIT)
            ||ready.callbackProfile!=IndexReadinessProfile.CALLBACK||ready.obligationManifest!=r.requiredManifest
            ||ready.coveredManifest!=r.requiredManifest||ready.provenFrom!=1||ready.completedAdmission!=a
            ||ready.completedPublication!=p||ready.generation!=r.expectedGeneration||ready.phase!=1)revert E_REPLACEMENT();
        if(_fixedRead(r.replacement,abi.encodeCall(IIndexModule.manifestHash,()),100_000)!=r.requiredManifest)revert E_REPLACEMENT();
        if(ready.physicalProfile==IndexReadinessProfile.FILES_SPLIT){
            address state=address(uint160(uint256(_fixedRead(r.replacement,abi.encodeWithSignature("scopeState()"),30_000))));
            if(state.code.length==0||state.codehash!=_fixedRead(r.replacement,abi.encodeWithSignature("scopeStateCodehash()"),30_000)
                ||uint256(_fixedRead(state,abi.encodeWithSignature("ledger()"),30_000))!=uint160(msg.sender)
                ||uint256(_fixedRead(state,abi.encodeWithSignature("writer()"),30_000))!=uint160(r.replacement))revert E_REPLACEMENT();
        }
        return IndexReadinessProfile.ACK;
    }

    function _fixedBytes(address target,bytes memory input,uint256 gasLimit,uint256 length) private view returns(bytes memory output){
        output=new bytes(length);bool ok;uint256 size;
        assembly("memory-safe"){
            ok:=staticcall(gasLimit,target,add(input,32),mload(input),add(output,32),length)
            size:=returndatasize()
        }
        if(!ok||size!=length)revert E_REPLACEMENT();
    }

    /// Fixed-output quote from bounded action bytes and canonical Type refs.
    /// Body work conservatively charges all256 possible words for each authored
    /// occurrence; actual index reads are sparse. Reuse/duplicate bodies may
    /// overquote, but unused budget is never demanded as an outer-gas reserve.
    function indexAllowance(address module,address registry,bytes calldata encoded) external view returns(uint256 budget){
        uint256 n;uint256 offset;
        assembly("memory-safe"){offset:=calldataload(encoded.offset) n:=calldataload(add(encoded.offset,32))}
        if(n==0||n>64||offset!=32||encoded.length!=64+n*288)revert E_BOUNDS(0);
        budget=IndexWork.BASE+IndexWork.ACTION*n;
        if(module==address(0))return budget;
        uint256 profileWord=uint256(_fixedRead(module,abi.encodeWithSignature("fieldProfile()"),30_000));
        if(profileWord>type(uint160).max)revert E_INDEX("");
        address profile=address(uint160(profileWord));
        for(uint256 i;i<n;i++){
            uint256 kind;bytes32 t;
            assembly("memory-safe"){
                let ptr:=add(add(encoded.offset,64),mul(i,288))
                kind:=calldataload(ptr) t:=calldataload(add(ptr,32))
            }
            if(kind!=1&&kind!=2)continue;
            (,,,,,uint8 refs,)=ITypeRegistry(registry).typeInfo(t);
            if(refs>8)revert E_BOUNDS(4);
            uint256 declarations=profile==address(0)?0:uint256(_fixedRead(profile,abi.encodeCall(IndexFieldProfile.workUnits,(t)),30_000));
            if(declarations>5)revert E_BOUNDS(4);
            budget+=IndexWork.REFERENCE*refs+IndexWork.DECLARATION*declarations+IndexWork.BODY_WORD*256;
        }
        if(budget>IndexWork.MAXIMUM)budget=IndexWork.MAXIMUM;
    }

    function _fixedRead(address target,bytes memory input,uint256 gasLimit) private view returns(bytes32 word){
        bool ok;uint256 size;
        assembly("memory-safe"){
            let ptr:=mload(0x40)
            ok:=staticcall(gasLimit,target,add(input,32),mload(input),ptr,32)
            size:=returndatasize() word:=mload(ptr)
        }
        if(!ok||size!=32)revert E_INDEX("");
    }

    function indexObligations(address module) public view returns(bytes32){
        if(module==address(0))return 0;
        bytes memory input=abi.encodeWithSelector(IIndexModule.manifestHash.selector);
        bytes32 manifest;bool ok;uint256 size;
        assembly("memory-safe"){
            let ptr:=mload(0x40)
            ok:=staticcall(100000,module,add(input,32),mload(input),ptr,32)
            size:=returndatasize() manifest:=mload(ptr)
        }
        if(!ok||size!=32||manifest==0)revert E_INDEX("");
        return keccak256(abi.encode(module,module.codehash,manifest));
    }

    /// Static publication codecs. Canonical mutation, authority, and Type-rule
    /// invocation remain Ledger-owned. Head comparison uses its caller-independent
    /// canonical getter, never a supplied source or a forwarded author.
    function readSetHash(bytes calldata encoded) external pure returns(bytes32) {
        return _readSetHash(_readSet(encoded));
    }

    function checkReadSet(bytes calldata encoded,bytes32 expectedHash) external view returns(bytes32 actualHash){
        return _checkedReadSet(_readSet(encoded),expectedHash,msg.sender);
    }

    function _checkedReadSet(ReadSet memory rs,bytes32 expectedHash,address source) private view returns(bytes32 actualHash){
        actualHash=_readSetHash(rs);
        if(actualHash!=expectedHash)revert E_INTENT(5);
        for(uint256 x;x<rs.positions.length;x++)for(uint256 y;y<rs.principalIds.length;y++){
            if(_fixedRead(source,abi.encodeWithSignature("headSnapshot(bytes32,bytes32)",rs.principalIds[y],rs.positions[x]),30_000)
                !=rs.expectedHeads[x*rs.principalIds.length+y])revert E_READSET_STALE(x,y);
        }
    }

    function _readSetHash(ReadSet memory rs) private pure returns(bytes32){
        return keccak256(abi.encode(keccak256("efs.lab.read-set/2:ordered-first-binding"),rs));
    }

    function _readSet(bytes calldata encoded) private pure returns(ReadSet memory rs){
        if(encoded.length>10_592)revert E_READSET_SHAPE();
        rs=abi.decode(encoded,(ReadSet));
        uint256 n=rs.principalIds.length;uint256 m=rs.positions.length;
        if(n>64 || m>4 || rs.expectedHeads.length!=n*m || (n==0)!=(m==0))revert E_READSET_SHAPE();
        for(uint256 i;i<n;i++){
            if(rs.principalIds[i]==0)revert E_READSET_SHAPE();
            for(uint256 j;j<i;j++)if(rs.principalIds[i]==rs.principalIds[j])revert E_READSET_SHAPE();
        }
        for(uint256 i;i<m;i++){
            if(rs.positions[i]==0)revert E_READSET_SHAPE();
            for(uint256 j;j<i;j++)if(rs.positions[i]==rs.positions[j])revert E_READSET_SHAPE();
        }
    }

    function acceptanceProfile(address registry,bytes calldata encoded) public view returns(bytes32 profile) {
        uint256 n;uint256 offset;
        assembly ("memory-safe"){offset:=calldataload(encoded.offset) n:=calldataload(add(encoded.offset,32))}
        // Preserve the public getter's ability to hash oversized candidates; Core
        // still refuses more than 64 actions at admission. Validate the exact
        // fixed-width ABI without multiplication overflow or trusting n alone.
        // Refuse unknown Types before callbacks. Otherwise a callback could
        // install a later leaf after its all-zero initial profile was signed.
        if(encoded.length<64 || offset!=32 || (encoded.length-64)%288!=0 || n!=(encoded.length-64)/288)revert E_BOUNDS(0);
        ITypeRegistry types=ITypeRegistry(registry);
        profile=keccak256(abi.encode(keccak256("efs.lab.acceptance-profile/2"),registry,types.epoch()));
        for(uint256 i;i<n;i++){
            uint256 kind;bytes32 typeId;
            assembly ("memory-safe") {
                let ptr:=add(add(encoded.offset,64),mul(i,288))
                kind:=calldataload(ptr) typeId:=calldataload(add(ptr,32))
            }
            if(kind!=1 && kind!=2)continue;
            (bool registered,address mandatory,bytes32 ruleId,address policy,bytes32 policyCodehash,,uint16 activation)=types.typeInfo(typeId);
            if(!registered)revert E_UNKNOWN_TYPE(typeId);
            profile=keccak256(abi.encode(profile,typeId,mandatory,ruleId,policy,policyCodehash,activation));
        }
    }

    /// Private wire format: module, remaining budget, final flag, publication,
    /// effect count, then 12 fixed ABI words per Effect. There are no dynamic
    /// members. Checked here as well as at the Ledger's bounded action ingress.
    fallback(bytes calldata raw) external returns(bytes memory) {
        address module;uint256 budget;bool finalPhase;uint256 publication;uint256 n;
        assembly ("memory-safe") {
            module:=calldataload(0) budget:=calldataload(32) finalPhase:=calldataload(64)
            publication:=calldataload(96) n:=calldataload(128)
        }
        if(n==0 || n>64 || raw.length!=160+n*384)revert E_INDEX("");
        bytes4 selector=finalPhase ? IIndexModule.afterPublication.selector : IIndexModule.onAdmission.selector;
        bytes memory input=new bytes(100+n*384);
        assembly ("memory-safe") {
            let data:=add(input,32)
            mstore(data,selector) mstore(add(data,4),publication)
            mstore(add(data,36),64) mstore(add(data,68),n)
            calldatacopy(add(data,100),160,mul(n,384))
        }
        // An unused joint allowance is not a mandatory outer-gas reserve. Reserve
        // bounded error/return accounting, then obey EIP-150's actual available gas.
        uint256 available=gasleft();
        if(available<=20_000)revert E_GAS();
        available=(available-20_000)*63/64;
        if(budget>available)budget=available;
        bool ok;uint256 returned;bytes memory result=new bytes(32);
        assembly ("memory-safe") {
            switch finalPhase
            case 0 {ok:=call(budget,module,0,add(input,32),mload(input),add(result,32),32)}
            default {ok:=staticcall(budget,module,add(input,32),mload(input),add(result,32),32)}
            returned:=returndatasize()
        }
        // Exact errors are retained up to this named diagnostic bound; oversized
        // success or revert data is refused without copying/decoding the payload.
        if(returned>4096)revert E_INDEX_RETURNDATA(returned);
        if(!ok){
            bytes memory reason=new bytes(returned);
            assembly ("memory-safe"){returndatacopy(add(reason,32),0,returned)}
            revert E_INDEX(reason);
        }
        if(finalPhase && (returned!=32 || bytes4(result)!=IIndexModule.afterPublication.selector))revert E_INDEX("");
        return "";
    }
}
