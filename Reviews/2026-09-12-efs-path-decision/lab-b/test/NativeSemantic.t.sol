// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {NativePublicationProof as N} from "../src/NativePublicationProof.sol";
import {RecentStateRootCheckpoint} from "../src/RecentStateRootCheckpoint.sol";
import {NativeSemanticVector} from "./NativeSemanticVector.sol";
contract NativeSemanticHarness is N {
    constructor(Anchor memory a) N(new RecentStateRootCheckpoint(),a){}
    function decode(Witness memory w,uint256[30] memory v) external view returns(Result memory r){return _decode(w,v,r);}
}
contract NativeSemanticTest {
    NativeSemanticHarness h;N.Witness w;uint256[30] v;bytes32 expected;
    function setUp() public {
        N.Anchor memory a;(a,w,v,expected)=abi.decode(NativeSemanticVector.encoded(),(N.Anchor,N.Witness,uint256[30],bytes32));
        h=new NativeSemanticHarness(a);
    }
    function test_actual_semantic_vector_and_later_withdrawal_preserve_claim() public {
        N.Result memory r=h.decode(w,v);require(r.claimId==expected&&r.occurrences==1&&!r.withdrawn,"actual claim");
        v[20]|=uint256(1)<<148;v[25]&=(uint256(1)<<80)-1;v[28]++;v[29]++;w.checkpoint+=300;
        r=h.decode(w,v);require(r.claimId==expected&&r.occurrences==0&&r.withdrawn,"retained history");
    }
    function _reject(uint256[30] memory values) private view {
        (bool ok,)=address(h).staticcall(abi.encodeCall(h.decode,(w,values)));require(!ok,"malformed authenticated state");
    }
    function test_reserved_bits_and_immutable_admission_mutation_refuse() public view {
        uint256[30] memory x=v;x[0]|=uint256(1)<<237;_reject(x);
        x=v;x[1]|=uint256(1)<<168;_reject(x);
        x=v;x[20]^=uint256(1)<<149;_reject(x);
        x=v;x[20]^=uint256(1)<<152;_reject(x);
        x=v;x[25]|=uint256(1)<<112;_reject(x);
        x=v;x[13]|=uint256(1)<<160;_reject(x);
    }
    function test_principal_action_origin_execution_and_lower_observations_refuse() public view {
        uint256[7] memory changed=[uint256(0),4,5,6,10,12,21];
        for(uint256 i;i<changed.length;i++){uint256[30] memory x=v;x[changed[i]]^=1;_reject(x);}
        uint256[30] memory x=v;x[28]=1;_reject(x);x=v;x[29]=0;_reject(x);x=v;x[26]=1;_reject(x);
    }
    function test_missing_retained_rows_wrong_keys_and_checkpoint_before_acceptance_refuse() public {
        uint256[30] memory x=v;x[24]=0;_reject(x);w.slots[0].key^=bytes32(uint256(1));_reject(v);
        w.slots[0].key^=bytes32(uint256(1));w.checkpoint=1;_reject(v);
    }
}
