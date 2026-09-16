// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {Ledger} from "../src/Ledger.sol";
import {TypeRegistry} from "../src/TypeRegistry.sol";
import {IAcceptor,IIndexModule} from "../src/Interfaces.sol";
import {IDescribedPredicate} from "../src/DescribedTypeProfile.sol";

/// State-sensitive fixture. Identical runtime does NOT mean equivalent state.
/// The creator's local signature, not a relayer's codehash claim, chooses it.
contract DescribedPredicateFixture is IDescribedPredicate {
    bytes32 public wrapperHash;address public allowedLedger;uint256 public mode;
    constructor(bytes32 wrapper,address ledger){wrapperHash=wrapper;allowedLedger=ledger;}
    function setMode(uint256 value) external {mode=value;}
    function acceptDescribed(address ledger,bytes32,bytes calldata data,bytes32[] calldata refs) external view returns(bool){
        if(msg.sender.codehash!=wrapperHash||ledger!=allowedLedger)return false;
        if(mode==1)return false;
        if(mode==2){assembly("memory-safe"){mstore(0,2) return(0,32)}}
        if(mode==3){assembly("memory-safe"){return(0,65536)}}
        if(mode==4){while(true){}}
        if(mode==5){
            if(refs.length!=1)return false;
            (,uint64 first,,)=Ledger(ledger).record(refs[0]);
            if(first==0||data[data.length-1]==0x21)return false;
        }
        return true;
    }
}
contract FakeDescribedLedger {
    TypeRegistry public immutable registry;
    constructor(TypeRegistry r){registry=r;}
    function ask(address rule,bytes32 t,bytes calldata body,bytes32[] calldata refs) external view returns(bool){
        return IAcceptor(rule).accept(t,body,refs);
    }
}
contract DescribedPermissivePolicy is IAcceptor {
    function accept(bytes32,bytes calldata,bytes32[] calldata) external pure returns(bool){return true;}
}
contract DescribedFinalFailure is IIndexModule {
    function fieldProfile() external pure returns(address){return address(0);}
    function manifestHash() external pure returns(bytes32){return keccak256("described-final-failure");}
    function onAdmission(uint64,Effect[] calldata) external pure {}
    function afterPublication(uint64,Effect[] calldata) external pure returns(bytes4){revert("final refusal");}
}
contract CallbackRegistrationIndex is IIndexModule {
    TypeRegistry public registry;bytes public descriptor;bytes public signature;bool public called;
    constructor(TypeRegistry r,bytes memory d,bytes memory s){registry=r;descriptor=d;signature=s;}
    function fieldProfile() external pure returns(address){return address(0);}
    function manifestHash() external pure returns(bytes32){return keccak256("described-registration-callback");}
    function onAdmission(uint64,Effect[] calldata) external {called=true;registry.registerDescribed(descriptor,signature,address(0),address(0),"");}
    function afterPublication(uint64,Effect[] calldata) external pure returns(bytes4){return IIndexModule.afterPublication.selector;}
}

/// Paid read/validation venue. Emitted digest makes the consumed bytes explicit;
/// raw transaction receipt, not eth_call/estimateGas, prices this path.
contract DescribedPaidConsumer {
    event Read(bytes32 indexed typeId,bytes32 descriptorHash,bytes32 recordId,bytes32 bodyHash);
    function consume(TypeRegistry registry,Ledger ledger,bytes32 typeId,bytes32 id) external {
        bytes memory d=registry.descriptorBytes(typeId);require(d.length>0,"missing descriptor");
        (,uint64 first,,bytes memory body)=ledger.record(id);require(first!=0,"missing record");
        emit Read(typeId,keccak256(d),id,keccak256(body));
    }
}
