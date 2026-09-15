// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {Ledger} from "./Ledger.sol";
import {SignedClaimArchiveBase} from "./SignedClaimArchive.sol";
import {IAcceptor} from "./Interfaces.sol";
import {TypeRegistry} from "./TypeRegistry.sol";
import {Keys} from "./Keys.sol";

/// Shape only: deployment-independent identity. Anyone may publish an assertion;
/// this rule proves neither archive correspondence nor helper execution.
contract RecoveryStatementRule is IAcceptor {
    function accept(bytes32,bytes calldata body,bytes32[] calldata refs) external pure returns(bool) {
        return refs.length==0 && body.length==224
            && bytes32(body[:32])==keccak256("efs.lab.recovery-lineage/1");
    }
}

/// DISPOSABLE SPIKE. A contiguous signed source EOA nonce prefix, beginning at
/// zero, into an unused destination EOA namespace. Source signature authenticity
/// is NOT source admission/guard truth, completeness beyond the supplied prefix,
/// or authority at destination. Each call needs fresh destination authorization.
/// Core stays unchanged: every resulting publication has isImported=false.
contract GuardedRecovery {
    struct Session { bytes32 sourceRealm; bytes32 sourceOrigin; uint64 nextSource; uint64 nextDestination; }
    struct Link { bytes32 publicationId; uint64 publication; }
    Ledger public immutable core;
    SignedClaimArchiveBase public immutable archive;
    bytes32 public immutable statementType;
    mapping(address=>Session) public sessions;
    mapping(bytes32=>Link) public links;
    bool private entered;
    error E_SOURCE();
    error E_PREFIX();
    error E_LINEAGE();
    error E_AUTHORITY();
    error E_CONTINUITY();
    error E_REENTRANT();
    event Recovered(bytes32 indexed claimId,bytes32 indexed publicationId,uint64 publication,bool reconciled);

    constructor(Ledger c,SignedClaimArchiveBase a,bytes32 t) {
        TypeRegistry registry=TypeRegistry(address(c.registry()));
        (bytes32 shape,bytes32 ruleHash,address rule,uint8 count,,)=registry.descriptor(t);
        bytes32[] memory refs=registry.refTypes(t);
        require(shape==keccak256("lab/type/recovery-statement/1") && count==0 && refs.length==0
            && ruleHash==keccak256(type(RecoveryStatementRule).runtimeCode) && rule.codehash==ruleHash
            && t==Keys.typeId(shape,refs,ruleHash),"STATEMENT_PROFILE");
        core=c;archive=a;statementType=t;
    }

    function recover(bytes32 claimId,Ledger.IntentV2 calldata destination,Ledger.Action[] calldata actions,
        bytes[] calldata bodies,Ledger.ReadSetV2 calldata readSet,bytes calldata signature) external returns(uint64 publication) {
        if(entered)revert E_REENTRANT();entered=true;
        if(archive.claimFormat(claimId)!=2)revert E_SOURCE();
        (Ledger.IntentV2 memory source,bytes32 sourceHash,uint16 n,,,,,,,)=archive.guardedClaim(claimId);
        if(n==0 || n>63 || actions.length!=uint256(n)+1 || bodies.length!=actions.length)revert E_PREFIX();
        if(source.author!=destination.author)revert E_AUTHORITY();
        Ledger.Action[] memory prefix=new Ledger.Action[](n);
        for(uint256 j;j<n;j++) {
            if(actions[j].kind==6)revert E_SOURCE();
            prefix[j]=actions[j];
        }
        if(keccak256(abi.encode(prefix))!=sourceHash)revert E_PREFIX();
        bytes memory statement=abi.encode(keccak256("efs.lab.recovery-lineage/1"),address(archive),address(this),claimId,
            source.realmOrigin,source.executionSet,sourceHash);
        Ledger.Action memory expected;
        expected.kind=1;expected.typeId=statementType;expected.bodyHashOrRecordId=keccak256(statement);
        if(keccak256(abi.encode(actions[n]))!=keccak256(abi.encode(expected))
            || keccak256(bodies[n])!=keccak256(statement))revert E_LINEAGE();
        if(core.readSetHash(readSet)!=destination.readSetHash)revert E_LINEAGE();
        bytes32 digest=core.guardedIntentDigest(destination,keccak256(abi.encode(actions)));
        _signature(destination.author,digest,signature);
        bytes32 publicationId=core.guardedPublicationId(Keys.principal(destination.author),digest);
        Link memory linked=links[claimId];
        if(linked.publication!=0) {
            if(linked.publicationId!=publicationId)revert E_LINEAGE();
            entered=false;return linked.publication; // no progression, even after later ordinary writes
        }
        Session memory s=sessions[destination.author];
        if(source.nonce!=s.nextSource || destination.nonce!=s.nextDestination
            || (s.nextSource!=0 && (source.realmId!=s.sourceRealm || source.realmOrigin!=s.sourceOrigin)))revert E_CONTINUITY();
        publication=core.publicationOf(publicationId);
        bool reconciled=publication!=0;
        if(reconciled) {
            // Exactly one prior same-author publication, never >=: unrelated
            // interleaving cannot be laundered by catching up this helper.
            if(core.nonces(destination.author)!=s.nextDestination+1)revert E_CONTINUITY();
            Ledger.PublicationContext memory p=core.publicationContext(publication);
            if(p.intentDigest!=digest || p.principalId!=Keys.principal(destination.author)
                || p.principalKind!=1 || p.authorizationProfile!=2 || p.intentFormat!=2 || core.isImported(publication))revert E_LINEAGE();
            // publicationOf binds the entire intent/action hash. Core signature
            // evidence plus the submitted signature authorizes this same digest.
        } else {
            if(core.nonces(destination.author)!=s.nextDestination)revert E_CONTINUITY();
            (publication,)=core.executeGuardedSigned(destination,actions,bodies,readSet,signature);
        }
        sessions[destination.author]=Session(source.realmId,source.realmOrigin,s.nextSource+1,s.nextDestination+1);
        links[claimId]=Link(publicationId,publication);
        emit Recovered(claimId,publicationId,publication,reconciled);
        entered=false;
    }
    function _signature(address author,bytes32 digest,bytes calldata signature) private pure {
        if(signature.length!=65)revert E_AUTHORITY();
        bytes32 r;bytes32 s;uint8 v;
        assembly("memory-safe") {r:=calldataload(signature.offset) s:=calldataload(add(signature.offset,32)) v:=byte(0,calldataload(add(signature.offset,64)))}
        if(uint256(s)>0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0 || (v!=27&&v!=28)
            || author==address(0) || ecrecover(digest,v,r,s)!=author)revert E_AUTHORITY();
    }
}
