// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {LabBase} from "./LabBase.sol";
import {Ledger} from "../src/Ledger.sol";
import {Keys} from "../src/Keys.sol";

interface IdentityVm { function etch(address, bytes calldata) external; function prank(address, address) external; }
interface ExplicitLens {
    function historyPrincipal(bytes32 principalId, bytes32 position, uint64 asOf) external view returns (uint8, bool, bytes32, uint32, uint64);
}

contract ConstructorIngressProbe {
    bool public accepted;
    constructor(Ledger l) {
        (accepted,) = address(l).call(abi.encodeCall(l.create, (bytes32("constructor"))));
    }
}

contract SignedConstructorRelay {
    constructor(Ledger l, Ledger.IntentV2 memory i, Ledger.Action[] memory a, Ledger.ReadSetV2 memory rs, bytes memory sig) {
        l.executeGuardedSigned(i,a,new bytes[](a.length),rs,sig);
    }
}

contract FoundationIdentityTest is LabBase {
    function testDirectKeyCheckedIngressAndConstructorSignatureRelay() public {
        Ledger.Action[] memory a = one(aCreate(bytes32("direct-key")));
        Ledger.ReadSetV2 memory rs;
        bytes32 execution = ledger.executionSet();
        IdentityVm(address(vm)).prank(eoaA,eoaA);
        (uint64 pub,) = ledger.executeGuarded(a,new bytes[](1),0,execution,rs);
        Ledger.PublicationContext memory c = ledger.publicationContext(pub);
        require(c.principalId == Keys.principal(eoaA) && c.principalKind == 1 && c.authorizationProfile == 1 && c.intentFormat == 2,"native key checked context");
        a = one(aCreate(bytes32("relayed-constructor")));
        Ledger.IntentV2 memory i = Ledger.IntentV2(REALM,ledger.realmOrigin(),execution,eoaA,1,uint64(block.timestamp+3600),
            ledger.acceptanceProfileOf(a),ledger.indexObligations(),ledger.readSetHash(rs));
        (uint8 v,bytes32 r,bytes32 s) = vm.sign(PK_A,ledger.guardedIntentDigest(i,keccak256(abi.encode(a))));
        SignedConstructorRelay relay = new SignedConstructorRelay(ledger,i,a,rs,abi.encodePacked(r,s,v));
        c = ledger.publicationContext(2);
        require(c.principalId == Keys.principal(eoaA) && c.authorizationProfile == 2 && ledger.nonces(address(relay)) == 0,"constructor relay acquired author authority");
        require(ledger.subjectCreatedAt(Keys.subject(Keys.principal(eoaA),bytes32("relayed-constructor"))) == 2,"signed constructor author");
    }
    function testSameAddressDifferentKindCannotWithdrawHistoricalContractAdmission() public {
        bytes32 r = alice.publish(BINARY, hex"1234");
        bytes32 author = pid(address(alice));
        IdentityVm(address(vm)).etch(address(alice), hex"");
        IdentityVm(address(vm)).prank(address(alice), address(alice));
        (bool ok,) = address(ledger).call(abi.encodeCall(ledger.execute, (one(aWithdraw(1)), new bytes[](1), uint64(1))));
        require(!ok, "same address stole contract occurrence");
        (,, uint32 occurrences,) = ledger.record(r);
        (,uint64 live,,) = index.postingHead(Keys.byAuthorList(author));
        require(occurrences == 1 && live == 1 && admissions() == 1, "historical index changed");
    }

    function testExplicitHistorySurvivesAccountReclassification() public {
        bytes32 s = alice.create(bytes32("f"));
        alice.bind(FOLDER, DRAFTS, name("f"), s, 0);
        bytes32 author = pid(address(alice));
        IdentityVm(address(vm)).etch(address(alice), hex"");
        (bool ok, bytes memory data) = address(lens).staticcall(abi.encodeCall(ExplicitLens.historyPrincipal,
            (author, Keys.position(FOLDER, DRAFTS, name("f")), uint64(2))));
        require(ok && data.length != 0, "explicit history missing");
        (uint8 status, bool live, bytes32 target,, uint64 at) = abi.decode(data, (uint8,bool,bytes32,uint32,uint64));
        require(status == 2 && live && target == s && at == 2, "historical identity reclassified");
    }
    // Break: bytecode-equivalent instances must never share a native author namespace.
    function testRealmOriginSeparatesIdenticalDeployments() public {
        Ledger other = new Ledger(registry, REALM);
        require(ledger.realmOrigin() != other.realmOrigin(), "instance origins collide");
    }

    // Break: constructor-time empty code must not silently claim the signing-key namespace.
    function testConstructorNativeIngressRejectedBeforeState() public {
        ConstructorIngressProbe probe = new ConstructorIngressProbe(ledger);
        require(!probe.accepted(), "constructor classified as key");
        require(admissions() == 0 && ledger.nonces(address(probe)) == 0, "constructor wrote state");
    }

    // Break: binding-only plans must be invalidated by registry configuration drift.
    function testBindingOnlySignedPolicyDriftRejected() public {
        bytes32 target = alice.create(bytes32("target"));
        Ledger.Action[] memory a = one(aBind(FOLDER, DRAFTS, name("x"), target, 0));
        (Ledger.Intent memory intent, bytes memory sig) = signed(PK_A, ledger, 0, a);
        registry.setBindingRefType(TAG, name("other"), BINARY);
        (bool ok, bytes memory err) = address(ledger).call(abi.encodeCall(ledger.executeSigned, (intent, a, new bytes[](1), sig)));
        require(!ok, "pure binding signature survived policy drift");
        expectSel(err, Ledger.E_INTENT.selector, "typed policy refusal");
        require(admissions() == 1 && ledger.nonces(eoaA) == 0, "partial binding effects");
    }
}
