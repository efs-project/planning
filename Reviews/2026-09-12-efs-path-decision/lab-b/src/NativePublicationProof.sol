// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {BoundedStateProof as B} from "./BoundedStateProof.sol";
import {RecentStateRootCheckpoint} from "./RecentStateRootCheckpoint.sol";
import {Ledger} from "./Ledger.sol";
import {Keys} from "./Keys.sol";
import {ExecutionSlots} from "./ExecutionSlots.sol";

/// Separate, fixed-profile verifier, not a Ledger feature or foreign finality
/// adapter. Constructor pins are the caller's independently selected trustworthy
/// direct deployment/initialization context. Codehash alone is NOT that context.
contract NativePublicationProof {
    bytes32 public constant PROFILE=keccak256("efs.lab.native-state/1:direct-immutable:guarded-single-publish:30-positive-keys:cancun");
    bytes32 private constant LAYOUT=keccak256("efs.lab.ledger-layout/2:roots-0-12-preserved:context-13:execution-14:readsets-15");
    struct Anchor {uint256 chainId;bytes32 instanceId;address ledger;bytes32 codeHash;bytes32 realmId;bytes32 deploymentId;bytes32 helperIdentity;}
    struct Slot {bytes32 key;bytes[] nodes;}
    struct Witness {uint64 checkpoint;uint64 publication;bytes body;bytes reads;bytes[] accountProof;Slot[] slots;}
    struct Result {
        bytes32 claimId;bytes32 witnessId;bytes32 recordId;bytes32 principalId;bytes32 stateRoot;
        uint64 acceptanceBlock;uint64 firstAdmission;uint32 occurrences;bool withdrawn;
    }
    RecentStateRootCheckpoint public immutable checkpoint;
    bytes32 public immutable anchorHash;
    Anchor public source;
    error InvalidNativeClaim();
    constructor(RecentStateRootCheckpoint checkpoint_,Anchor memory anchor){
        if(address(checkpoint_).code.length==0||anchor.chainId!=block.chainid||anchor.instanceId==0||anchor.ledger==address(0)
            ||anchor.codeHash==0||anchor.realmId==0||anchor.deploymentId==0||anchor.helperIdentity==0)revert InvalidNativeClaim();
        checkpoint=checkpoint_;source=anchor;anchorHash=keccak256(abi.encode(anchor));
    }
    function verify(Witness memory w) public view returns(Result memory r){
        if(w.slots.length!=30||w.body.length>8192||w.reads.length<224||w.reads.length>10592
            ||w.checkpoint==0||w.checkpoint>=1<<40||w.publication==0||w.publication>=type(uint48).max)revert InvalidNativeClaim();
        uint256 total=B.bounds(w.accountProof);
        for(uint256 i;i<30;i++){
            total+=B.bounds(w.slots[i].nodes);
            for(uint256 j;j<i;j++)if(w.slots[i].key==w.slots[j].key)revert InvalidNativeClaim();
        }
        if(total>262144)revert InvalidNativeClaim();
        (,r.stateRoot)=checkpoint.roots(w.checkpoint);if(r.stateRoot==0)revert InvalidNativeClaim();
        (bytes32 storageRoot,bytes32 codeHash)=B.account(r.stateRoot,source.ledger,w.accountProof);
        if(codeHash!=source.codeHash)revert InvalidNativeClaim();
        uint256[30] memory v;
        uint256 scratch;
        assembly("memory-safe"){scratch:=mload(0x40)}
        for(uint256 i;i<30;i++){
            v[i]=B.storageValue(storageRoot,w.slots[i].key,w.slots[i].nodes);
            // Only a scalar escapes. Witness/root/result and v are allocated
            // below scratch. Upstream memory is temporary but not assumed clean:
            // zero every reclaimed word before reuse so Solidity allocations get
            // their ordinary fresh-memory semantics, including padding/arrays.
            // Work is bounded by the already checked per-path/node byte limits.
            assembly("memory-safe"){
                let end:=mload(0x40)
                for {let ptr:=scratch} lt(ptr,end) {ptr:=add(ptr,32)} {mstore(ptr,0)}
                mstore(0x40,scratch)
            }
        }
        r=_decode(w,v,r);
        r.witnessId=keccak256(abi.encode(PROFILE,r.stateRoot,w));
    }
    function _decode(Witness memory w,uint256[30] memory v,Result memory r) internal view returns(Result memory){
        address author=address(uint160(v[0]));uint64 first=uint48(v[0]>>188);uint64 basis=uint64(v[1]>>128);
        if(first==0||basis==0||basis>w.checkpoint||v[1]>>168!=0
            ||v[0]!=(uint256(uint160(author))|(uint256(1)<<160)|(uint256(1)<<172)|(uint256(first)<<188))
            ||v[9]!=0x020102||v[23]!=w.publication)revert InvalidNativeClaim();
        if(v[27]!=source.chainId||v[28]<v[11]||v[11]==0||v[29]<uint256(uint64(v[1]))+1||v[29]>type(uint64).max
            ||uint64(v[26])<first||v[26]>>192<w.publication)revert InvalidNativeClaim();
        bytes32 origin=keccak256(abi.encode(keccak256("efs.lab.realm-origin/2"),source.chainId,source.ledger));
        if(bytes32(v[10])!=origin||bytes32(v[5])!=Keys.contractPrincipal(origin,author))revert InvalidNativeClaim();
        if(v[13]>type(uint160).max||v[15]>type(uint160).max||v[17]>type(uint160).max||v[19]>type(uint64).max)revert InvalidNativeClaim();
        Ledger.ExecutionInfo memory ex=Ledger.ExecutionInfo(origin,v[11],bytes32(v[12]),address(uint160(v[13])),bytes32(v[14]),
            address(uint160(v[15])),bytes32(v[16]),address(uint160(v[17])),bytes32(v[18]),uint64(v[19]));
        if(ex.implementation!=source.ledger||ex.shellCodeHash!=source.codeHash||ex.implementationCodeHash!=source.codeHash
            ||keccak256(abi.encode(keccak256("efs.lab.execution-set/2"),LAYOUT,_domain("1"),_domain("2"),ex))!=bytes32(v[6]))revert InvalidNativeClaim();
        _reads(w.reads,bytes32(v[7]));
        uint256 normal=v[20]&~(uint256(1)<<148);
        if(uint16(v[20]>>152)==0||normal!=(uint256(1)|(uint256(w.publication)<<20)|(uint256(uint16(v[20]>>152))<<152))
            ||keccak256(w.body)!=bytes32(v[21])||v[22]!=v[24])revert InvalidNativeClaim();
        uint64 recordFirst=uint48(v[25]);
        if(recordFirst==0||recordFirst>first||uint32(v[25]>>48)!=w.body.length||v[25]>>112!=0)revert InvalidNativeClaim();
        r.recordId=Keys.recordFromHash(bytes32(v[22]),bytes32(v[21]));
        Ledger.Action[] memory actions=new Ledger.Action[](1);actions[0].kind=1;actions[0].typeId=bytes32(v[22]);actions[0].bodyHashOrRecordId=bytes32(v[21]);
        if(keccak256(abi.encode(actions))!=bytes32(v[4]))revert InvalidNativeClaim();
        Ledger.IntentV2 memory intent=Ledger.IntentV2(source.realmId,origin,bytes32(v[6]),author,uint64(v[1]),uint64(v[1]>>64),bytes32(v[2]),bytes32(v[3]),bytes32(v[7]));
        bytes32 digest=keccak256(abi.encodePacked(hex"1901",_domain("2"),keccak256(abi.encode(
            keccak256("IntentV2(bytes32 realmId,bytes32 realmOrigin,bytes32 executionSet,address author,uint64 nonce,uint64 deadline,bytes32 acceptanceProfile,bytes32 indexObligations,bytes32 readSetHash,bytes32 actionsHash)"),intent,bytes32(v[4])))));
        if(digest!=bytes32(v[8]))revert InvalidNativeClaim();
        bytes32 publicationId=keccak256(abi.encode(keccak256("efs.lab.publication/2"),bytes32(v[5]),digest));
        bytes32[30] memory keys=_keys(w.publication,first,bytes32(v[6]),publicationId,r.recordId,author);
        for(uint256 i;i<30;i++)if(keys[i]!=w.slots[i].key)revert InvalidNativeClaim();
        r.claimId=keccak256(abi.encode(PROFILE,anchorHash,w.publication,first,basis,digest,r.recordId,recordFirst,normal));
        r.principalId=bytes32(v[5]);r.acceptanceBlock=basis;r.firstAdmission=first;r.occurrences=uint32(v[25]>>80);r.withdrawn=(v[20]&(uint256(1)<<148))!=0;
        return r;
    }
    function _reads(bytes memory raw,bytes32 expected) private pure {
        Ledger.ReadSetV2 memory rs=abi.decode(raw,(Ledger.ReadSetV2));
        uint256 n=rs.principalIds.length;uint256 m=rs.positions.length;
        if(keccak256(abi.encode(rs))!=keccak256(raw)||n>64||m>4||(n==0)!=(m==0)||rs.expectedHeads.length!=n*m
            ||keccak256(abi.encode(keccak256("efs.lab.read-set/2:ordered-first-binding"),rs))!=expected)revert InvalidNativeClaim();
        for(uint256 i;i<n;i++){if(rs.principalIds[i]==0)revert InvalidNativeClaim();for(uint256 j;j<i;j++)if(rs.principalIds[i]==rs.principalIds[j])revert InvalidNativeClaim();}
        for(uint256 i;i<m;i++){if(rs.positions[i]==0)revert InvalidNativeClaim();for(uint256 j;j<i;j++)if(rs.positions[i]==rs.positions[j])revert InvalidNativeClaim();}
    }
    function _domain(string memory version) private pure returns(bytes32){return keccak256(abi.encode(keccak256("EIP712Domain(string name,string version)"),keccak256("EFS2-RoadB-Lab"),keccak256(bytes(version))));}
    function _map(bytes32 key,uint256 root) private pure returns(uint256){return uint256(keccak256(abi.encode(key,root)));}
    function _keys(uint64 p,uint64 first,bytes32 execution,bytes32 publicationId,bytes32 recordId,address author) private pure returns(bytes32[30] memory k){
        uint256 b=_map(bytes32(uint256(p)),6);k[0]=bytes32(b);for(uint256 i=1;i<5;i++)k[i]=bytes32(b+i+2);
        b=_map(bytes32(uint256(p)),13);for(uint256 i;i<5;i++)k[5+i]=bytes32(b+i);
        b=_map(execution,14);for(uint256 i;i<10;i++)k[10+i]=bytes32(b+i);
        b=_map(bytes32(uint256(first)),5);for(uint256 i;i<3;i++)k[20+i]=bytes32(b+i);
        k[23]=bytes32(_map(publicationId,7));b=_map(recordId,2);k[24]=bytes32(b);k[25]=bytes32(b+1);k[26]=bytes32(uint256(1));
        k[27]=ExecutionSlots.GENESIS;k[28]=ExecutionSlots.REVISION;k[29]=bytes32(_map(bytes32(uint256(uint160(author))),11));
    }
}
