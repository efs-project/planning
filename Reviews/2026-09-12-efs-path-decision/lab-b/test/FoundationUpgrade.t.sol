// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {LabBase} from "./LabBase.sol";
import {Ledger} from "../src/Ledger.sol";
import {Keys} from "../src/Keys.sol";
import {IndexModule} from "../src/IndexModule.sol";
import {LensReader} from "../src/LensReader.sol";
import {Actor} from "../src/LabHarness.sol";
import {TypeRegistry} from "../src/TypeRegistry.sol";
import {ITypeRegistry} from "../src/Interfaces.sol";
import {UpgradeProxy} from "./UpgradeProxy.sol";

interface UpgradeVm { function prank(address, address) external; function chainId(uint256) external; }
interface UpgradeCodeVm { function etch(address,bytes calldata) external; }
contract LayoutIncompatibleLedger is Ledger {
    constructor(ITypeRegistry r, bytes32 realm) Ledger(r,realm) {}
    function layoutId() public pure override returns(bytes32) { return keccak256("incompatible-layout"); }
}
contract WrongAdminFactory {
    function deploy(ITypeRegistry r, bytes32 realm) external returns(Ledger) { return new Ledger(r,realm); }
}
contract WrongDomainCandidate {
    Ledger private immutable base;
    bool private immutable wrongGuarded;
    constructor(Ledger l,bool guarded) { base = l; wrongGuarded = guarded; }
    function implementationSelf() external view returns(address) { return address(this); }
    function domainSeparator() external view returns(bytes32) { return wrongGuarded ? base.domainSeparator() : bytes32("wrong"); }
    function guardedDomainSeparator() external view returns(bytes32) { return wrongGuarded ? bytes32("wrong") : base.guardedDomainSeparator(); }
    fallback() external {
        (bool ok,bytes memory output) = address(base).staticcall(msg.data);
        assembly ("memory-safe") { if iszero(ok) { revert(add(output,32),mload(output)) } return(add(output,32),mload(output)) }
    }
}

contract FoundationUpgradeTest is LabBase {
    UpgradeProxy private proxy;
    Ledger private v1;
    Ledger private v2;
    function setUp() public override {
        super.setUp();
        v1 = ledger;
        proxy = new UpgradeProxy(v1);
        ledger = Ledger(address(proxy));
        v2 = new Ledger(registry,REALM);
        index = new IndexModule(address(ledger)); ledger.setIndexModule(address(index));
        lens = new LensReader(ledger,index); alice = new Actor(ledger); bob = new Actor(ledger);
    }
    function principals() private view returns(bytes32[] memory p) {
        p = new bytes32[](2); p[0] = pid(address(alice)); p[1] = pid(address(bob));
    }
    function testPopulatedUpgradePreservesRootsMaskHistoryAndWithdrawal() public {
        bytes32 s = alice.create(bytes32("file"));
        bytes32 r = alice.publish(BINARY,hex"123456");
        alice.bind(FOLDER,DRAFTS,name("f"),s,0); bob.bind(FOLDER,DRAFTS,name("f"),s,0);
        alice.unbind(FOLDER,DRAFTS,name("f"),1);
        bytes32[] memory p = principals();
        bytes32 execution1 = ledger.executionSet(); bytes32 origin = ledger.realmOrigin();
        bytes32 counter = ledger.extsload(bytes32(uint256(1)));
        bytes32 recordSlot = keccak256(abi.encode(r,uint256(2)));
        bytes32 bodySlot = keccak256(abi.encode(uint256(0),keccak256(abi.encode(r,uint256(3)))));
        require(ledger.extsload(recordSlot) == BINARY && ledger.extsload(bodySlot) == bytes32(hex"123456"), "roots 2 and 3 retained");
        Ledger.PublicationContext memory oldContext = ledger.publicationContext(2);
        LensReader.PrincipalCursor memory fresh;
        LensReader.PrincipalPage memory page = lens.listPrincipals(p,FOLDER,DRAFTS,fresh,1);
        proxy.upgradeTo(v2);
        require(ledger.extsload(bytes32(uint256(1))) == counter && ledger.realmOrigin() == origin, "upgrade changed populated storage/origin");
        require(ledger.extsload(recordSlot) == BINARY && ledger.extsload(bodySlot) == bytes32(hex"123456"), "packed record/body roots moved");
        require(pid(address(alice)) == p[0] && ledger.executionSet() != execution1, "stable identity versus new execution");
        require(keccak256(abi.encode(oldContext)) == keccak256(abi.encode(ledger.publicationContext(2))), "historical execution rewritten");
        (uint8 status,,uint32 revision,bytes32 author,uint64 at) = lens.resolvePrincipals(p,FOLDER,DRAFTS,name("f"),ledger.executionSet());
        require(status == 2 && revision == 2 && author == p[0] && at == 5, "upper removal mask preserved");
        (uint8 historyStatus,bool live,bytes32 target,,uint64 historyAt) = lens.historyPrincipalAt(p[0],Keys.position(FOLDER,DRAFTS,name("f")),3,ledger.executionSet());
        require(historyStatus == 2 && live && target == s && historyAt == 3, "publication-final historical head");
        (bool ok,) = address(lens).staticcall(abi.encodeCall(lens.listPrincipals,(p,FOLDER,DRAFTS,page.next,uint256(1))));
        require(!ok,"old cursor survived implementation activation");
        alice.execute(one(aWithdraw(2)),new bytes[](1));
        (,,uint32 occurrences,bytes memory body) = ledger.record(r);
        (,uint64 authorLive,,) = index.postingHead(Keys.byAuthorList(p[0]));
        require(occurrences == 0 && keccak256(body) == keccak256(hex"123456") && authorLive == 0, "retained withdrawal principal/index");
        require(ledger.publicationContext(6).executionSet != oldContext.executionSet, "new publication context");
        require(ledger.executionInfo(oldContext.executionSet).implementation == address(v1), "old execution component record");
    }
    function testRollbackAndSameCodeReactivationCannotReviveSignedPlan() public {
        Ledger.Action[] memory a = one(aCreate(bytes32("signed")));
        Ledger.ReadSetV2 memory rs;
        Ledger.IntentV2 memory i = Ledger.IntentV2(REALM,ledger.realmOrigin(),ledger.executionSet(),eoaA,0,uint64(block.timestamp+3600),
            ledger.acceptanceProfileOf(a),ledger.indexObligations(),ledger.readSetHash(rs));
        (uint8 v,bytes32 r,bytes32 s) = vm.sign(PK_A,ledger.guardedIntentDigest(i,keccak256(abi.encode(a))));
        bytes memory sig = abi.encodePacked(r,s,v);
        proxy.upgradeTo(v2); proxy.upgradeTo(v1);
        require(ledger.executionRevision() == 4,"monotonic rollback revision");
        (bool ok,bytes memory err) = address(ledger).call(abi.encodeCall(ledger.executeGuardedSigned,(i,a,new bytes[](1),rs,sig)));
        require(!ok && sel(err) == Ledger.E_INTENT.selector && admissions() == 0 && ledger.nonces(eoaA) == 0,"rollback revived signature");
        bytes32 beforeExecution = ledger.executionSet(); proxy.upgradeTo(v1);
        require(ledger.executionSet() != beforeExecution && ledger.executionRevision() == 5,"same-code activation must advance");
    }
    function testUpgradeRejectsUnauthorizedAndIncompatibleTargetsAtomically() public {
        UpgradeVm(address(vm)).prank(eoaA,eoaA);
        (bool ok,bytes memory err) = address(proxy).call(abi.encodeCall(proxy.upgradeTo,(v2)));
        require(!ok && sel(err) == UpgradeProxy.E_UPGRADE_ADMIN.selector,"unauthorized upgrade");
        refuse(new Ledger(new TypeRegistry(),REALM));
        refuse(new Ledger(registry,bytes32("wrong-realm")));
        refuse(new LayoutIncompatibleLedger(registry,REALM));
        refuse((new WrongAdminFactory()).deploy(registry,REALM));
        refuse(Ledger(address(0)));
        refuse(Ledger(address(new WrongDomainCandidate(v1,false))));
        refuse(Ledger(address(new WrongDomainCandidate(v1,true))));
    }

    function testExplicitListConflictAndHistoricalKeysNeverReclassifyAccounts() public {
        bytes32 f = alice.create(bytes32("alice-file")); bytes32 g = bob.create(bytes32("bob-file"));
        alice.bind(FOLDER,DRAFTS,name("shared"),f,0); bob.bind(FOLDER,DRAFTS,name("shared"),g,0);
        bytes32[] memory p = principals();
        UpgradeCodeVm(address(vm)).etch(address(alice),hex"");
        (uint8 status,LensReader.PrincipalEntry[] memory candidates) = lens.resolveNoTiebreakPrincipals(p,FOLDER,DRAFTS,name("shared"),ledger.executionSet());
        require(status == 3 && candidates.length == 2 && candidates[0].principalId == p[0] && candidates[1].target == g,"explicit conflict domain changed");
        LensReader.PrincipalCursor memory cursor;
        LensReader.PrincipalPage memory page = lens.listPrincipals(p,FOLDER,DRAFTS,cursor,256);
        require(page.status == 2 && page.rawTotal == 2 && page.scanned == 2 && page.items.length == 1
            && page.items[0].target == f && page.items[0].principalId == p[0],"explicit masking/list domain changed");
        require(page.next.executionSet == ledger.executionSet() && page.next.lensHash == keccak256(abi.encode(p)),"explicit cursor commitments");
    }
    function refuse(Ledger candidate) private {
        bytes32 execution = ledger.executionSet(); bytes32 counter = ledger.extsload(bytes32(uint256(1)));
        (bool ok,) = address(proxy).call(abi.encodeCall(proxy.upgradeTo,(candidate)));
        require(!ok && proxy.implementation() == address(v1) && ledger.executionSet() == execution
            && ledger.extsload(bytes32(uint256(1))) == counter,"incompatible upgrade mutated state");
    }
    function testProxyLegacyIngressExplicitlyUnsupportedDirectStillSupported() public {
        Ledger.Action[] memory a = one(aCreate(bytes32("legacy")));
        (Ledger.Intent memory i,bytes memory sig) = signed(PK_A,ledger,0,a);
        (bool ok,bytes memory err) = address(ledger).call(abi.encodeCall(ledger.executeSigned,(i,a,new bytes[](1),sig)));
        require(!ok && sel(err) == Ledger.E_LEGACY_UNSUPPORTED.selector,"proxy legacy signature accepted");
        Ledger.SourceEvidence memory source;
        (ok,err) = address(ledger).call(abi.encodeCall(ledger.importPublication,(source,a,new bytes[](1),i,sig)));
        require(!ok && sel(err) == Ledger.E_LEGACY_UNSUPPORTED.selector,"proxy legacy import accepted");
        (i,sig) = signed(PK_A,v1,0,a); v1.executeSigned(i,a,new bytes[](1),sig);
        require(v1.nonces(eoaA) == 1 && ledger.nonces(eoaA) == 0,"direct legacy boundary");
    }
    function testGenesisChainChangeRefusesIngressButNotHistoricalOrigin() public {
        bytes32 origin = ledger.realmOrigin();
        uint256 genesis = ledger.genesisChainId();
        UpgradeVm(address(vm)).chainId(genesis+1);
        (bool ok,bytes memory err) = address(ledger).call(abi.encodeCall(ledger.create,(bytes32("new-chain"))));
        require(!ok && sel(err) == Ledger.E_CHAIN.selector && ledger.realmOrigin() == origin,"chain mismatch silently reoriginated");
    }
}
