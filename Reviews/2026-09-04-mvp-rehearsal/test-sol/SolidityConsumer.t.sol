// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {EfsLab} from "../src/EfsLab.sol";
import {LabRead} from "../consumer/LabRead.sol";
import {LabReadConsumer} from "../consumer/LabReadConsumer.sol";

contract BadSurface {
    uint8 immutable mode;
    constructor(uint8 m) { mode=m; }
    fallback() external {
        if(msg.sig==bytes4(keccak256("runId()"))) { assembly { mstore(0,9) return(0,32) } }
        uint8 m=mode;
        if(m==0) revert();
        if(m==1) { assembly { mstore(0,1) return(0,4096) } }
        if(m==2) { assembly { mstore(0,1) return(0,32) } }
        assembly { for {} 1 {} {} }
    }
}
contract SolidityConsumerTest {
    EfsLab lab; LabReadConsumer consumer; bytes32 file;
    function setUp() public {
        lab=new EfsLab(address(this),bytes32(uint256(9))); consumer=new LabReadConsumer();
        EfsLab.Operation memory o=EfsLab.Operation(2,lab.rootId(),"hello",0,bytes("abc"),bytes32(uint256(1)),0,0,uint64(block.timestamp+100),0);
        file=lab.executeDirect(o);
    }
    function testActualCurrentFileReadAndPinnedMismatch() public view {
        LabRead.FileResult memory r=consumer.currentFile(address(lab),address(lab).codehash,lab.runId(),1,file);
        require(r.status==LabRead.Status.FOUND&&r.fileId==file&&r.revision==1,"actual file");
        require(r.contentId==lab.getRevision(file,1).contentId&&r.previous==0,"actual revision");
        r=consumer.currentFile(address(lab),bytes32(uint256(1)),lab.runId(),1,file); require(r.status==LabRead.Status.MISMATCH,"wrong code");
        r=consumer.currentFile(address(lab),address(lab).codehash,bytes32(uint256(1)),1,file); require(r.status==LabRead.Status.MISMATCH,"wrong run");
        r=consumer.currentFile(address(lab),address(lab).codehash,lab.runId(),2,file); require(r.status==LabRead.Status.UNSUPPORTED,"wrong profile");
    }
    function testActualExactTypedScoreAndWrongSchema() public {
        bytes32 schema=lab.registerSchema(hex"01");
        EfsLab.Operation memory o=EfsLab.Operation(4,lab.rootId(),"",schema,hex"000000000000002a",0,0,1,uint64(block.timestamp+100),0);
        bytes32 record=lab.executeDirect(o);
        (LabRead.Status status,uint64 score)=consumer.score(address(lab),address(lab).codehash,lab.runId(),1,record,schema);
        require(status==LabRead.Status.FOUND&&score==42,"typed score");
        (status,score)=consumer.score(address(lab),address(lab).codehash,lab.runId(),1,record,bytes32(uint256(7)));
        require(status==LabRead.Status.MISMATCH&&score==0,"wrong schema");
    }
    function testRevertOversizedMalformedAndGasBurnAreUnknown() public {
        for(uint8 i;i<4;++i) {
            BadSurface bad=new BadSurface(i);
            LabRead.FileResult memory r=consumer.currentFile(address(bad),address(bad).codehash,bytes32(uint256(9)),1,file);
            require(r.status==LabRead.Status.UNKNOWN&&r.contentId==0,"untrusted call not found or absent");
        }
        LabRead.FileResult memory missing=consumer.currentFile(address(lab),address(lab).codehash,lab.runId(),1,bytes32(uint256(123)));
        require(missing.status==LabRead.Status.UNKNOWN,"missing revert is unknown not absence");
    }
}
