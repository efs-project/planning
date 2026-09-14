// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {LabBase} from "./LabBase.sol";
import {Ledger} from "../src/Ledger.sol";
import {Keys} from "../src/Keys.sol";
import {LensReader} from "../src/LensReader.sol";
import {Actor} from "../src/LabHarness.sol";
import {UpgradeProxy} from "./UpgradeProxy.sol";
import {FilesLayout,FilesRootRule,FilesChildRule,FilesParentIndex} from "./FilesJoinedProfile.sol";
import {FilesJoinedConsumer} from "./FilesJoinedConsumer.sol";
import {FilesApplication} from "./FilesApplication.sol";

interface FilesIdentityVm { function etch(address,bytes calldata) external; }
contract FoundationFilesTest is LabBase {
    UpgradeProxy private proxy;
    FilesApplication private app;
    FilesJoinedConsumer private reader;
    bytes32 private file;
    bytes32 private root;
    bytes32 private rootType;
    bytes32 private childType;
    bytes32 private constant APPROVED = keccak256("approved");

    function setUp() public override {
        super.setUp();
        proxy = new UpgradeProxy(ledger); ledger = Ledger(address(proxy));
        FilesRootRule rootRule = new FilesRootRule();
        rootType = registry.register(FilesLayout.ROOT_SHAPE,address(rootRule),new bytes32[](0));
        FilesChildRule childRule = new FilesChildRule(rootType);
        childType = registry.register(FilesLayout.CHILD_SHAPE,address(childRule),new bytes32[](1));
        FilesParentIndex fi = new FilesParentIndex(address(ledger),rootType,childType,address(rootRule).codehash,address(childRule).codehash);
        index = fi; ledger.setIndexModule(address(fi)); lens = new LensReader(ledger,fi);
        alice = new Actor(ledger); bob = new Actor(ledger);
        reader = new FilesJoinedConsumer(ledger,lens,fi,rootType,childType,address(rootRule).codehash,address(childRule).codehash);
        file = Keys.subject(Keys.principal(eoaA),bytes32("signed-file"));
        bytes memory body = bytes.concat(abi.encode(file),bytes("original document"));
        root = Keys.record(rootType,body);
        Ledger.Action[] memory a = new Ledger.Action[](4); bytes[] memory bodies = new bytes[](4);
        a[0] = aCreate(bytes32("signed-file")); a[1] = aPublish(rootType,body); bodies[1] = body;
        a[2] = aBind(HEAD,file,0,root,0); a[3] = aBind(FOLDER,DRAFTS,name("signed.txt"),file,0);
        Ledger.ReadSetV2 memory rs;
        Ledger.IntentV2 memory i = Ledger.IntentV2(REALM,ledger.realmOrigin(),ledger.executionSet(),eoaA,0,uint64(block.timestamp+3600),
            ledger.acceptanceProfileOf(a),ledger.indexObligations(),ledger.readSetHash(rs));
        (uint8 v,bytes32 r,bytes32 s) = vm.sign(PK_A,ledger.guardedIntentDigest(i,keccak256(abi.encode(a))));
        ledger.executeGuardedSigned(i,a,bodies,rs,abi.encodePacked(r,s,v));
        bob.bind(TAG,root,APPROVED,file,0);
        app = new FilesApplication(ledger,reader,address(this),eoaA,address(bob),APPROVED);
    }

    function testSameApplicationUsesRetainedSelectorsAndNewExecutionAfterUpgrade() public {
        bytes32 principal = pid(address(app)); bytes32 oldExecution = ledger.executionSet();
        Ledger.PublicationContext memory source = ledger.publicationContext(1);
        callGuarded(0,oldExecution);
        require(app.adoptionCount() == 1,"native app first adoption");
        bytes32 beforeUpgrade = ledger.extsload(bytes32(uint256(1)));
        proxy.upgradeTo(new Ledger(registry,REALM));
        require(ledger.extsload(bytes32(uint256(1))) == beforeUpgrade && pid(address(app)) == principal,"app identity/storage upgrade");
        FilesIdentityVm(address(vm)).etch(address(bob),hex"");
        // Reviewer was a contract at approval and at application construction. Its
        // now-empty code must not rewrite the application's pinned selector.
        callGuarded(1,ledger.executionSet());
        require(app.adoptionCount() == 2 && ledger.nonces(address(app)) == 2,"same app not usable after compatible upgrade");
        require(ledger.publicationContext(1).intentDigest == source.intentDigest && source.executionSet == oldExecution,"old signed context changed");
        (,,uint32 occurrences,) = ledger.record(app.lastRevision());
        require(occurrences == 2,"native revisions must be admitted under preserved author");
        (bool ok,) = address(app).call(guardedCall(2,oldExecution));
        require(!ok && app.adoptionCount() == 2,"stale app basis accepted");
    }

    function callGuarded(uint32 rev,bytes32 execution) private {
        (bool ok,) = address(app).call(guardedCall(rev,execution));
        require(ok,"guarded explicit-principal application missing or rejected");
    }
    function guardedCall(uint32 rev,bytes32 execution) private view returns(bytes memory) {
        FilesJoinedConsumer.Basis memory b = FilesJoinedConsumer.Basis(admissions(),index.generation(),registry.epoch(),execution);
        return abi.encodeWithSignature("adoptApprovedRevisionGuarded(bytes32,bytes32,uint32,(uint64,uint64,uint64,bytes32))",file,root,rev,b);
    }
}
