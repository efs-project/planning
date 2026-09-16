// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {Ledger} from "./Ledger.sol";
import {ContractSignatureEvidenceStore,ContractSignatureProfile,ContractSignatureCode} from "./ContractSignatureEvidenceStore.sol";
import {Keys} from "./Keys.sol";

/// DISPOSABLE retention companion. No destination edit/import authority.
contract ContractSignatureEvidenceArchive {
    struct Context {
        uint256 chainId;address ledger;uint64 publication;uint64 firstAdmission;uint64 basis;
        Ledger.IntentV2 intent;Ledger.ExecutionInfo execution;
        address store;bytes32 walletCodehash;bytes32 evidenceHash;
    }
    struct Bundle {Context context;bytes actions;bytes reads;bytes signature;}
    struct Receipt {uint8 grade;address importer;uint64 retainedAt;address envelope;address reads;address signature;}
    Ledger public immutable source;
    bytes32 public immutable sourceCodehash;
    address public immutable implementation;
    bytes32 public immutable implementationCodehash;
    bytes32 public immutable execution;
    mapping(bytes32=>Receipt) public receipts;
    error E_EVIDENCE();
    constructor(Ledger source_) {
        source=source_;sourceCodehash=address(source_).codehash;
        implementation=source_.implementationSelf();implementationCodehash=implementation.codehash;
        execution=source_.executionSet();
    }
    /// grade1 is byte integrity ONLY; grade2 additionally relies on this archive's
    /// independently selected, immutable local source/execution pins. Deploying a
    /// lookalike archive is not a way to acquire somebody else's selected trust.
    function retain(Bundle calldata b,bool local) external returns(bytes32 id){
        (bytes32 digest,uint16 leaves)=_validate(b);
        if(local)_local(b,digest,leaves);
        id=keccak256(abi.encode(b));
        Receipt storage r=receipts[id];
        if(r.grade==0){
            r.importer=msg.sender;r.retainedAt=uint64(block.number);
            r.envelope=address(new ContractSignatureCode(abi.encode(b.context,b.actions)));
            r.reads=address(new ContractSignatureCode(b.reads));
            r.signature=address(new ContractSignatureCode(b.signature));
        }
        if(local||r.grade==0)r.grade=local?2:1;
    }
    function bundle(bytes32 id) external view returns(Bundle memory b){
        Receipt storage r=receipts[id];if(r.grade==0)revert E_EVIDENCE();
        (b.context,b.actions)=abi.decode(_read(r.envelope),(Context,bytes));
        b.reads=_read(r.reads);b.signature=_read(r.signature);
        if(keccak256(abi.encode(b))!=id)revert E_EVIDENCE();
    }
    function _read(address carrier) private view returns(bytes memory raw){
        bytes memory runtime=carrier.code;
        if(runtime.length==0||runtime.length>24576||runtime[0]!=0)revert E_EVIDENCE();
        raw=new bytes(runtime.length-1);
        assembly("memory-safe"){mcopy(add(raw,32),add(runtime,33),mload(raw))}
    }
    function _validate(Bundle calldata b) private pure returns(bytes32 digest,uint16 leaves){
        Context calldata c=b.context;
        if(b.actions.length<352||b.actions.length>18496||b.reads.length<224||b.reads.length>10592||b.signature.length>4096
            ||c.chainId==0||c.ledger==address(0)||c.publication==0||c.firstAdmission==0||c.intent.author==address(0)
            ||c.store==address(0)||c.walletCodehash==0)revert E_EVIDENCE();
        Ledger.Action[] memory actions=abi.decode(b.actions,(Ledger.Action[]));
        if(actions.length==0||actions.length>64||keccak256(abi.encode(actions))!=keccak256(b.actions))revert E_EVIDENCE();
        leaves=uint16(actions.length);
        Ledger.ReadSetV2 memory rs=abi.decode(b.reads,(Ledger.ReadSetV2));
        uint256 n=rs.principalIds.length;uint256 m=rs.positions.length;
        if(n>64||m>4||(n==0)!=(m==0)||rs.expectedHeads.length!=n*m||keccak256(abi.encode(rs))!=keccak256(b.reads))revert E_EVIDENCE();
        for(uint256 i;i<n;i++){
            if(rs.principalIds[i]==0)revert E_EVIDENCE();
            for(uint256 j;j<i;j++)if(rs.principalIds[i]==rs.principalIds[j])revert E_EVIDENCE();
        }
        for(uint256 i;i<m;i++){
            if(rs.positions[i]==0)revert E_EVIDENCE();
            for(uint256 j;j<i;j++)if(rs.positions[i]==rs.positions[j])revert E_EVIDENCE();
        }
        if(keccak256(abi.encode(keccak256("efs.lab.read-set/2:ordered-first-binding"),rs))!=c.intent.readSetHash
            ||keccak256(abi.encode(keccak256("efs.lab.realm-origin/2"),c.chainId,c.ledger))!=c.intent.realmOrigin
            ||c.execution.origin!=c.intent.realmOrigin)revert E_EVIDENCE();
        bytes32 domainType=keccak256("EIP712Domain(string name,string version)");
        bytes32 domain=keccak256(abi.encode(domainType,keccak256("EFS2-RoadB-Lab"),keccak256("2")));
        bytes32 legacy=keccak256(abi.encode(domainType,keccak256("EFS2-RoadB-Lab"),keccak256("1")));
        if(keccak256(abi.encode(keccak256("efs.lab.execution-set/2"),
            keccak256("efs.lab.ledger-layout/2:roots-0-12-preserved:context-13:execution-14:readsets-15"),legacy,domain,c.execution))!=c.intent.executionSet)revert E_EVIDENCE();
        digest=keccak256(abi.encodePacked(hex"1901",domain,keccak256(abi.encode(
            keccak256("IntentV2(bytes32 realmId,bytes32 realmOrigin,bytes32 executionSet,address author,uint64 nonce,uint64 deadline,bytes32 acceptanceProfile,bytes32 indexObligations,bytes32 readSetHash,bytes32 actionsHash)"),c.intent,keccak256(b.actions)))));
        if(keccak256(abi.encode(ContractSignatureProfile.EVIDENCE,c.store,c.ledger,c.publication,digest,
            ContractSignatureProfile.ID,c.walletCodehash,keccak256(b.signature)))!=c.evidenceHash)revert E_EVIDENCE();
    }
    function _local(Bundle calldata b,bytes32 digest,uint16 leaves) private view {
        Context calldata c=b.context;
        if(c.chainId!=block.chainid||c.ledger!=address(source)||address(source).codehash!=sourceCodehash
            ||source.implementationSelf()!=implementation||implementation.codehash!=implementationCodehash
            ||c.intent.executionSet!=execution||c.store.codehash!=keccak256(type(ContractSignatureEvidenceStore).runtimeCode))revert E_EVIDENCE();
        Ledger.PublicationContext memory expected=Ledger.PublicationContext(Keys.contractPrincipal(c.intent.realmOrigin,c.intent.author),
            execution,c.intent.readSetHash,digest,2,3,2);
        if(keccak256(abi.encode(source.publicationContext(c.publication)))!=keccak256(abi.encode(expected))
            ||source.realmId()!=c.intent.realmId
            ||keccak256(abi.encode(source.executionInfo(execution)))!=keccak256(abi.encode(c.execution))
            ||keccak256(source.readSetBytes(c.intent.readSetHash))!=keccak256(b.reads))revert E_EVIDENCE();
        bytes memory wanted=abi.encode(c.intent.author,uint8(3),uint8(0),leaves,c.firstAdmission,c.evidenceHash,
            bytes32(uint256(uint160(c.store))),c.intent.nonce,c.intent.deadline,c.basis,
            c.intent.acceptanceProfile,c.intent.indexObligations,keccak256(b.actions));
        bytes memory input=abi.encodeCall(source.evidence,(c.publication));
        bytes memory actual=new bytes(416);address target=address(source);bool ok;uint256 size;
        assembly("memory-safe"){
            ok:=staticcall(gas(),target,add(input,32),mload(input),add(actual,32),416) size:=returndatasize()
        }
        if(!ok||size!=416||keccak256(wanted)!=keccak256(actual))revert E_EVIDENCE();
        ContractSignatureEvidenceStore.Evidence memory e=ContractSignatureEvidenceStore(c.store).evidence(c.ledger,c.publication);
        if(e.evidenceHash!=c.evidenceHash||e.digest!=digest||e.walletCodehash!=c.walletCodehash
            ||e.profile!=ContractSignatureProfile.ID||keccak256(e.signature)!=keccak256(b.signature))revert E_EVIDENCE();
    }
}
