// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {LabBase} from "./LabBase.sol";
import {Ledger} from "../src/Ledger.sol";
import {Keys} from "../src/Keys.sol";

interface IdentityVm {
    function etch(address target, bytes calldata code) external;
    function prank(address sender) external;
}

/// Synthetic account-code transition regressions, NOT real Prague/7702 tx tests.
/// The first three tests failed before the delegation-marker classification fix.
contract IdentityTransitionTest is LabBase {
    function _seed() internal returns (bytes32 file, bytes32 root, uint64 occurrence) {
        file = Keys.subject(Keys.principal(eoaA), bytes32(uint256(7702)));
        root = rid(QUOTE, q(3000));
        Ledger.Action[] memory a = new Ledger.Action[](3);
        a[0] = aCreate(bytes32(uint256(7702)));
        a[1] = aPublish(QUOTE, q(3000));
        a[2] = aBind(HEAD, file, NO_ROLE, root, 0);
        bytes[] memory b = new bytes[](3);
        b[1] = q(3000);
        (Ledger.Intent memory intent, bytes memory sig) = signed(PK_A, ledger, 0, a);
        (, uint64 first) = ledger.executeSigned(intent, a, b, sig);
        occurrence = first + 1;
        bob.bind(HEAD, file, NO_ROLE, bob.publish(QUOTE, q(3100)), 0);
    }

    function _changeCode() internal {
        IdentityVm(address(vm)).etch(eoaA, abi.encodePacked(hex"ef0100", address(bob)));
        require(eoaA.code.length == 23, "synthetic nonzero-code classification");
    }

    function test_signed_head_survives_account_code_transition() public {
        (bytes32 file, bytes32 root,) = _seed();
        (uint8 status, bytes32 target,,,) = lens.resolve(lensOf(eoaA,address(bob)), HEAD,file,NO_ROLE);
        require(status == 1 && target == root, "baseline source selected");
        uint64 beforeAdmission = admissions();
        _changeCode();
        bytes32 key = Keys.binding(Keys.principal(eoaA), Keys.position(HEAD,file,NO_ROLE));
        (uint8 raw,,,,, bytes32 retained) = ledger.head(key);
        require(raw == 1 && retained == root && admissions() == beforeAdmission, "retained row unchanged");
        (status,target,,,) = lens.resolve(lensOf(eoaA,address(bob)), HEAD,file,NO_ROLE);
        require(status == 1 && target == root, "signed source must not disappear after code transition");
    }

    function test_signed_removal_mask_does_not_fall_through_after_account_code_transition() public {
        (bytes32 file,,) = _seed();
        Ledger.Action[] memory a = one(aUnbind(HEAD,file,NO_ROLE,1));
        (Ledger.Intent memory intent, bytes memory sig) = signed(PK_A,ledger,1,a);
        ledger.executeSigned(intent,a,new bytes[](1),sig);
        (uint8 status,,,,) = lens.resolve(lensOf(eoaA,address(bob)),HEAD,file,NO_ROLE);
        require(status == 2, "baseline mask");
        uint64 beforeAdmission = admissions();
        _changeCode();
        bytes32 key = Keys.binding(Keys.principal(eoaA), Keys.position(HEAD,file,NO_ROLE));
        (uint8 raw,,,,,) = ledger.head(key);
        require(raw == 2 && admissions() == beforeAdmission, "mask row unchanged");
        (status,,,,) = lens.resolve(lensOf(eoaA,address(bob)),HEAD,file,NO_ROLE);
        require(status == 2, "mask must not fall through without EFS mutation");
    }

    function test_withdrawal_releases_original_authors_occurrence_count() public {
        (,bytes32 root,uint64 occurrence) = _seed();
        bytes32 original = Keys.byAuthorList(Keys.principal(eoaA));
        (,uint64 liveBefore,,) = index.postingHead(original);
        require(liveBefore == 1, "one original author occurrence");
        _changeCode();
        Ledger.Action[] memory a = one(aWithdraw(occurrence));
        uint64 nonce = ledger.nonces(eoaA);
        IdentityVm(address(vm)).prank(eoaA);
        ledger.execute(a,new bytes[](1),nonce);
        (,,uint32 occurrences,) = ledger.record(root);
        require(occurrences == 0, "actual occurrence withdrawn");
        (,uint64 liveAfter,,) = index.postingHead(original);
        require(liveAfter == 0, "withdrawal must release the historical author index");
    }

    function test_delegate_replacement_clear_and_reinstall_preserve_key_namespace() public {
        (bytes32 file,bytes32 root,) = _seed();
        _changeCode();
        require(ledger.principalOf(eoaA) == Keys.principal(eoaA), "delegated key identity");
        IdentityVm(address(vm)).etch(eoaA, abi.encodePacked(hex"ef0100", address(alice)));
        require(ledger.principalOf(eoaA) == Keys.principal(eoaA), "replacement key identity");
        IdentityVm(address(vm)).etch(eoaA, hex"");
        require(ledger.principalOf(eoaA) == Keys.principal(eoaA), "cleared key identity");
        _changeCode();
        (uint8 status,bytes32 target,,,) = lens.resolve(lensOf(eoaA,address(bob)),HEAD,file,NO_ROLE);
        require(status == 1 && target == root, "reinstalled source");
    }

    function test_only_exact_delegation_indicator_is_key_identity() public {
        bytes32 native = Keys.contractPrincipal(ledger.realmOrigin(),eoaA);
        IdentityVm(address(vm)).etch(eoaA, abi.encodePacked(hex"ef0200", address(bob)));
        require(ledger.principalOf(eoaA) == native, "wrong prefix");
        // Foundry itself refuses malformed-length delegation indicators; do not
        // pretend this impossible marker was executed as normal chain bytecode.
        (bool accepted,) = address(vm).call(abi.encodeCall(IdentityVm.etch,
            (eoaA,abi.encodePacked(hex"ef0100",address(bob),hex"00"))));
        require(!accepted, "VM rejects malformed delegation length");
        IdentityVm(address(vm)).etch(eoaA, abi.encodePacked(hex"600000", address(bob), hex"00"));
        require(ledger.principalOf(eoaA) == native, "ordinary 24 byte runtime");
        IdentityVm(address(vm)).etch(eoaA, abi.encodePacked(hex"600000", address(bob)));
        require(ledger.principalOf(eoaA) == native, "ordinary 23 byte runtime");
        require(ledger.principalOf(address(bob)) != Keys.principal(address(bob)), "ordinary contracts stay origin qualified");
    }

    function test_native_delegated_ingress_keeps_native_evidence_not_action_signature() public {
        _changeCode();
        Ledger.Action[] memory a = one(aPublish(QUOTE,q(4000)));
        bytes[] memory b = new bytes[](1); b[0] = q(4000);
        IdentityVm(address(vm)).prank(eoaA);
        (uint64 nativePub,) = ledger.execute(a,b,0);
        (address author,uint8 kind,,,,,,,,,,,) = ledger.evidence(nativePub);
        require(author == eoaA && kind == 1, "native is not signed evidence");
        (,uint64 live,,) = index.postingHead(Keys.byAuthorList(Keys.principal(eoaA)));
        require(live == 1, "native delegated ingress shares key namespace");
        (Ledger.Intent memory intent,bytes memory sig) = signed(PK_A,ledger,1,a);
        (uint64 signedPub,) = ledger.executeSigned(intent,a,b,sig);
        (author,kind,,,,,,,,,,,) = ledger.evidence(signedPub);
        require(author == eoaA && kind == 2, "per-action signature remains distinct");
    }
}
