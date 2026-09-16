// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {LabBase} from "./LabBase.sol";
import {Ledger} from "../src/Ledger.sol";
import {Keys} from "../src/Keys.sol";
import {ContractSignatureWallet,SignatureApprovalOracle,ContractSignatureWalletProxy,RefusingWalletImplementation} from "./ContractSignatureWallet.sol";
import {ContractSignatureEvidenceStore,ContractSignatureProfile} from "../src/ContractSignatureEvidenceStore.sol";
import {UpgradeProxy} from "./UpgradeProxy.sol";
import {IndexModule} from "../src/IndexModule.sol";
import {FailingIndexModule} from "../src/LabHarness.sol";

interface SignatureVm {function etch(address,bytes calldata) external;function prank(address) external;}

interface WalletIngress {
    function executeGuarded1271(Ledger.IntentV2 calldata intent,Ledger.Action[] calldata actions,
        bytes[] calldata bodies,Ledger.ReadSetV2 calldata reads,bytes calldata signature) external returns(uint64,uint64);
}

abstract contract Guarded1271Harness is LabBase {
    SignatureVm internal constant svm=SignatureVm(address(uint160(uint256(keccak256("hevm cheat code")))));
    function _evidence(Ledger core,uint64 publication) internal view returns(ContractSignatureEvidenceStore.Evidence memory e) {
        (address author,uint8 kind,uint8 v,,,bytes32 h,bytes32 pointer,,,,,,)=core.evidence(publication);
        require(kind==3&&v==0&&uint256(pointer)<=type(uint160).max,"typed union");
        e=ContractSignatureEvidenceStore(address(uint160(uint256(pointer)))).evidence(address(core),publication);
        require(e.evidenceHash==h&&e.profile==ContractSignatureProfile.ID&&e.digest==core.publicationContext(publication).intentDigest,"joined evidence");
        require(e.walletCodehash==author.codehash,"acceptance codehash");
    }
    function _data(Ledger core,ContractSignatureWallet wallet,bytes memory signature,bytes32 salt)
        internal returns(bytes memory data) {
        Ledger.Action[] memory a=one(aCreate(salt));Ledger.ReadSetV2 memory rs;
        Ledger.IntentV2 memory intent=_intent(core,address(wallet),a,rs);
        wallet.approve(core.guardedIntentDigest(intent,keccak256(abi.encode(a))),signature);
        return abi.encodeCall(WalletIngress.executeGuarded1271,(intent,a,new bytes[](1),rs,signature));
    }
    function _intent(Ledger core,address wallet,Ledger.Action[] memory a,Ledger.ReadSetV2 memory rs)
        internal view returns(Ledger.IntentV2 memory) {
        return Ledger.IntentV2(core.realmId(),core.realmOrigin(),core.executionSet(),wallet,core.nonces(wallet),
            uint64(block.timestamp+3600),core.acceptanceProfileOf(a),core.indexObligations(),core.readSetHash(rs));
    }
}
contract Guarded1271Test is Guarded1271Harness {
    // Break caught: no explicit opaque wallet lane, wrong caller, EOA namespace,
    // or failure to put signature-authorized and native calls on one nonce.
    function test_opaque_wallet_relay_uses_contract_principal_and_shared_native_nonce() public {
        ContractSignatureWallet wallet=new ContractSignatureWallet(address(ledger));
        Ledger.Action[] memory a=one(aCreate(bytes32("wallet-file")));
        Ledger.ReadSetV2 memory rs;
        Ledger.IntentV2 memory intent=_intent(ledger,address(wallet),a,rs);
        bytes memory signature=hex"010203040506070809";
        bytes32 digest=ledger.guardedIntentDigest(intent,keccak256(abi.encode(a)));
        wallet.approve(digest,signature);
        (bool ok,bytes memory result)=address(ledger).call(abi.encodeCall(WalletIngress.executeGuarded1271,
            (intent,a,new bytes[](1),rs,signature)));
        require(ok,"deployed ERC1271 opaque ingress missing");
        (uint64 publication,)=abi.decode(result,(uint64,uint64));
        Ledger.PublicationContext memory c=ledger.publicationContext(publication);
        require(c.principalId==Keys.contractPrincipal(ledger.realmOrigin(),address(wallet)),"wallet namespace");
        require(c.principalKind==2&&c.authorizationProfile==3&&c.intentFormat==2&&c.intentDigest==digest,"distinct context");
        require(ledger.subjectCreatedAt(Keys.subject(c.principalId,a[0].salt))==1,"wallet subject");
        wallet.nativeCreate(bytes32("native-after-signed"));
        require(ledger.nonces(address(wallet))==2&&ledger.nonces(address(this))==0,"shared wallet nonce");
        require(keccak256(_evidence(ledger,1).signature)==keccak256(signature),"exact opaque signature");
    }

    // Missing/empty conflation or evidence revalidated against today's wallet.
    function test_empty_and_max_signatures_survive_rotation_and_missing_is_not_empty() public {
        ContractSignatureWallet wallet=new ContractSignatureWallet(address(ledger));
        bytes memory input=_data(ledger,wallet,"",bytes32("empty"));
        (bool ok,)=address(ledger).call(input);require(ok,"approved empty");
        ContractSignatureEvidenceStore.Evidence memory empty=_evidence(ledger,1);
        require(empty.signature.length==0&&empty.carrier.code.length==1,"authentic empty carrier");
        bytes memory maximum=new bytes(4096);maximum[4095]=0xff;
        input=_data(ledger,wallet,maximum,bytes32("max"));
        (ok,)=address(ledger).call(input);require(ok,"max");
        require(keccak256(_evidence(ledger,2).signature)==keccak256(maximum),"max retained");
        input=_data(ledger,wallet,new bytes(4097),bytes32("too-long"));
        (ok,)=address(ledger).call(input);require(!ok&&ledger.nonces(address(wallet))==2,"over max admitted");
        wallet.rotate(eoaB);
        require(_evidence(ledger,1).signature.length==0&&keccak256(_evidence(ledger,2).signature)==keccak256(maximum),"rotation erased history");
        (,,,,,,bytes32 pointer,,,,,,)=ledger.evidence(1);
        (ok,)=address(uint160(uint256(pointer))).staticcall(abi.encodeCall(ContractSignatureEvidenceStore.evidence,(address(ledger),uint64(3))));
        require(!ok,"missing conflated with authentic empty");
    }

    // Any missing STATICCALL/result/return bound accepts one of these real modes.
    function test_staticcall_failure_modes_and_short_forwarding_refuse_without_residue() public {
        ContractSignatureWallet wallet=new ContractSignatureWallet(address(ledger));
        bytes memory input=_data(ledger,wallet,hex"1234",bytes32("never"));
        for(uint256 m=1;m<=8;m++){
            wallet.configure(m);(bool modeOk,)=address(ledger).call(input);require(!modeOk,"invalid wallet accepted");
            require(admissions()==0&&ledger.nonces(address(wallet))==0&&wallet.writes()==0&&index.lastProcessed()==0,"failure residue");
        }
        wallet.configure(0);(bool ok,)=address(ledger).call{gas:300_000}(input);
        require(!ok&&admissions()==0,"underfunded profile accepted");
        wallet.approve(bytes32("wrong digest"),hex"1234");
        (ok,)=address(ledger).call(input);require(!ok,"wrong digest accepted");
    }

    function test_no_code_and_delegated_key_are_not_ordinary_wallets() public {
        Ledger.Action[] memory a=one(aCreate(bytes32("unsupported")));Ledger.ReadSetV2 memory rs;
        for(uint256 i;i<2;i++){
            if(i==1)svm.etch(eoaA,abi.encodePacked(hex"ef0100",address(ledger)));
            Ledger.IntentV2 memory intent=_intent(ledger,eoaA,a,rs);
            (bool ok,)=address(ledger).call(abi.encodeCall(WalletIngress.executeGuarded1271,(intent,a,new bytes[](1),rs,bytes(""))));
            require(!ok&&ledger.nonces(eoaA)==0,"unsupported account accepted");
        }
    }

    function test_controller_signature_rotation_preserves_original_evidence() public {
        ContractSignatureWallet wallet=new ContractSignatureWallet(address(ledger));
        wallet.configure(9);wallet.rotate(eoaA);
        Ledger.Action[] memory a=one(aCreate(bytes32("controller")));Ledger.ReadSetV2 memory rs;
        Ledger.IntentV2 memory intent=_intent(ledger,address(wallet),a,rs);
        (uint8 v,bytes32 r,bytes32 s)=vm.sign(PK_A,ledger.guardedIntentDigest(intent,keccak256(abi.encode(a))));
        bytes memory sig=abi.encodePacked(r,s,v);
        (bool ok,)=address(ledger).call(abi.encodeCall(WalletIngress.executeGuarded1271,(intent,a,new bytes[](1),rs,sig)));
        require(ok,"real wallet controller signature rejected");
        a[0].salt=bytes32("after-rotation");intent=_intent(ledger,address(wallet),a,rs);
        (v,r,s)=vm.sign(PK_A,ledger.guardedIntentDigest(intent,keccak256(abi.encode(a))));
        svm.prank(eoaA);wallet.rotate(eoaB);
        (ok,)=address(ledger).call(abi.encodeCall(WalletIngress.executeGuarded1271,(intent,a,new bytes[](1),rs,abi.encodePacked(r,s,v))));
        require(!ok&&ledger.nonces(address(wallet))==1,"old controller admitted after rotation");
        require(keccak256(_evidence(ledger,1).signature)==keccak256(sig),"historical controller bytes changed");
    }

    function test_native_wins_nonce_race_and_exact_retry_is_noop() public {
        ContractSignatureWallet wallet=new ContractSignatureWallet(address(ledger));
        bytes memory input=_data(ledger,wallet,hex"abc123",bytes32("race"));
        wallet.nativeCreate(bytes32("native-first"));
        (bool ok,bytes memory err)=address(ledger).call(input);require(!ok&&sel(err)==Ledger.E_NONCE.selector,"signed nonce race");
        input=_data(ledger,wallet,hex"abc123",bytes32("signed-next"));
        (ok,)=address(ledger).call(input);require(ok,"signed after native");
        (ok,err)=address(ledger).call(input);require(!ok&&sel(err)==Ledger.AlreadyAdmitted.selector&&ledger.nonces(address(wallet))==2,"retry changed state");
    }

    function test_transitive_state_reads_allowed_but_transitive_writes_refused() public {
        ContractSignatureWallet wallet=new ContractSignatureWallet(address(ledger));
        SignatureApprovalOracle oracle=new SignatureApprovalOracle();wallet.dependency(address(oracle));wallet.configure(10);
        bytes memory input=_data(ledger,wallet,hex"bada55",bytes32("oracle"));
        oracle.approve(wallet.digest(),keccak256(hex"bada55"),false);
        (bool ok,)=address(ledger).call(input);require(ok,"transitive state read refused");
        input=_data(ledger,wallet,hex"bada55",bytes32("oracle-write"));
        oracle.approve(wallet.digest(),keccak256(hex"bada55"),true);
        (ok,)=address(ledger).call(input);require(!ok&&oracle.writes()==0&&ledger.nonces(address(wallet))==1,"transitive write admitted");
    }

    function test_wallet_implementation_change_does_not_revalidate_historical_bytes() public {
        ContractSignatureWallet implementation=new ContractSignatureWallet(address(ledger));
        ContractSignatureWalletProxy shell=new ContractSignatureWalletProxy(address(ledger),address(implementation));
        ContractSignatureWallet wallet=ContractSignatureWallet(address(shell));
        bytes memory input=_data(ledger,wallet,hex"cafef00d",bytes32("wallet-proxy"));
        (bool ok,)=address(ledger).call(input);require(ok,"deployed proxy wallet rejected");
        input=_data(ledger,wallet,hex"cafef00d",bytes32("new-rule"));
        shell.upgrade(address(new RefusingWalletImplementation()));
        (ok,)=address(ledger).call(input);require(!ok,"changed implementation accepted");
        require(keccak256(_evidence(ledger,1).signature)==keccak256(hex"cafef00d"),"current implementation consulted for history");
    }

    function test_store_namespace_write_once_and_code_pin() public {
        ContractSignatureWallet wallet=new ContractSignatureWallet(address(ledger));
        bytes memory input=_data(ledger,wallet,hex"00",bytes32("namespaced"));
        (address support,)=ledger.publicationSupportIdentity();
        (bool ok,bytes memory raw)=support.staticcall(abi.encodeWithSignature("signatureStoreIdentity()"));require(ok);
        (address store,)=abi.decode(raw,(address,bytes32));
        ContractSignatureEvidenceStore(store).retain(1,bytes32("forged"),bytes32("code"),hex"11");
        (ok,)=address(ledger).call(input);require(ok,"other caller occupied Ledger namespace");
        require(_evidence(ledger,1).signature.length==1,"wrong namespace used");
        (ok,)=store.call(abi.encodeCall(ContractSignatureEvidenceStore.retain,(uint64(1),bytes32("again"),bytes32("code"),hex"22")));
        require(!ok,"namespace rewrite allowed");
        input=_data(ledger,wallet,hex"00",bytes32("pin"));svm.etch(store,hex"00");
        (ok,)=address(ledger).call(input);require(!ok&&ledger.nonces(address(wallet))==1,"changed store code admitted");
    }

    function test_proxy_caller_upgrade_and_original_store_pointer() public {
        UpgradeProxy proxy=new UpgradeProxy(ledger);Ledger core=Ledger(address(proxy));
        core.setIndexModule(address(new IndexModule(address(core))));
        ContractSignatureWallet wallet=new ContractSignatureWallet(address(core));
        bytes memory input=_data(core,wallet,hex"0102",bytes32("before"));
        (bool ok,)=address(core).call(input);require(ok,"wallet did not see proxy");
        ContractSignatureEvidenceStore.Evidence memory beforeEvidence=_evidence(core,1);
        (,,,,,,bytes32 pointer,,,,,,)=core.evidence(1);
        bytes memory queued=_data(core,wallet,hex"0304",bytes32("queued"));
        Ledger next=new Ledger(registry,REALM);proxy.upgradeTo(next);
        (ok,)=address(core).call(queued);require(!ok,"old execution accepted");
        require(keccak256(_evidence(core,1).signature)==keccak256(beforeEvidence.signature),"old signature after upgrade");
        (,,,,,,bytes32 afterPointer,,,,,,)=core.evidence(1);require(afterPointer==pointer,"old store pointer overwritten");
        input=_data(core,wallet,hex"0506",bytes32("after"));(ok,)=address(core).call(input);require(ok,"upgraded wallet ingress");
        (,,,,,,bytes32 newPointer,,,,,,)=core.evidence(2);require(newPointer!=pointer,"new release did not use new store");
        require(core.nonces(address(wallet))==2&&ledger.nonces(address(wallet))==0,"proxy storage namespace");
    }

    function test_later_action_rule_index_and_enclosing_app_rollback_evidence() public {
        ContractSignatureWallet wallet=new ContractSignatureWallet(address(ledger));
        Ledger.Action[] memory a=one(aPublish(QUOTE,hex"01"));Ledger.ReadSetV2 memory rs;
        Ledger.IntentV2 memory intent=_intent(ledger,address(wallet),a,rs);
        wallet.approve(ledger.guardedIntentDigest(intent,keccak256(abi.encode(a))),hex"77");
        bytes[] memory bodies=new bytes[](1);bodies[0]=hex"01";
        (bool ok,)=address(ledger).call(abi.encodeCall(WalletIngress.executeGuarded1271,(intent,a,bodies,rs,hex"77")));
        require(!ok,"rule accepted short body");_rolledBack(wallet,intent.readSetHash);
        bytes memory input=_data(ledger,wallet,hex"88",bytes32("app"));
        (ok,)=address(wallet).call(abi.encodeCall(wallet.executeThenRevert,(input)));require(!ok,"app did not revert");
        _rolledBack(wallet,intent.readSetHash);
        ledger.setIndexModule(address(new FailingIndexModule()));
        input=_data(ledger,wallet,hex"99",bytes32("index"));(ok,)=address(ledger).call(input);
        require(!ok,"failing index accepted");_rolledBack(wallet,intent.readSetHash);
    }
    function _rolledBack(ContractSignatureWallet wallet,bytes32 readHash) private view {
        require(admissions()==0&&ledger.nonces(address(wallet))==0&&ledger.readSetBytes(readHash).length==0,"publication residue");
        (address author,,,,,,,,,,,,)=ledger.evidence(1);require(author==address(0),"evidence residue");
        (address support,)=ledger.publicationSupportIdentity();
        (bool ok,bytes memory raw)=support.staticcall(abi.encodeWithSignature("signatureStoreIdentity()"));require(ok);
        (address store,)=abi.decode(raw,(address,bytes32));
        (ok,)=store.staticcall(abi.encodeCall(ContractSignatureEvidenceStore.evidence,(address(ledger),uint64(1))));
        require(!ok,"signature-store residue");
    }
}
