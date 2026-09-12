// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {StateKernelTest, VmAcceptance} from "./StateKernel.t.sol";
import {StatefulHarness} from "./StatefulHarness.sol";
import {StateKernel} from "../src/StateKernel.sol";
import {StateStore} from "../src/StateStore.sol";
import {Preparation, IPreparation} from "../src/Preparation.sol";
import {PreparationHelper} from "../src/PreparationHelper.sol";
import {AdmissionLibrary} from "../src/AdmissionLibrary.sol";
import {BindingFold} from "../src/BindingFold.sol";

interface VmDirect {
    function getNonce(address) external view returns (uint64);
    function computeCreateAddress(address, uint256) external pure returns (address);
    function envOr(string calldata, bool) external view returns (bool);
    function load(address, bytes32) external view returns (bytes32);
}

// Test-only host: the actual Files authorization nonce is independently covered
// by the receipt runner. This minimal boundary shows nonce rollback with Core.
contract DirectHost is StatefulHarness {
    uint256 public authorizationNonce;
    constructor(StateKernel.Init memory init, address helper)
        StatefulHarness(init, helper, helper.codehash, address(AdmissionLibrary).codehash)
    {}

    function authorized(StateKernel.VerifiedContext memory v, StateKernel.Publication memory p)
        external
        returns (StateKernel.AdmitResult memory)
    {
        ++authorizationNonce;
        return this.publishTrustedForTest(v, p);
    }

    function cachePointer(bytes32 id) external view returns (address) {
        return s.types[id].cacheCode;
    }
}

// Counterexample helper, NOT a supported production extension. Compilation and
// ordinary preparation still use the real helper/parser; only observation and
// cache callback behavior are varied at the exact external boundary.
contract ObservingPreparation is IPreparation {
    PreparationHelper immutable real = new PreparationHelper();
    StatefulHarness public host;
    bytes32 public watchedRecord;
    uint64 public oldRecords;
    uint8 public mode;
    bool public sawProvisionalCacheCallback;
    bool private entered;
    StateKernel.Publication private nested;
    error ObservedProvisionalRecord();
    error InjectedCacheFailure();

    function configure(StatefulHarness h, bytes32 recordId, uint8 m, StateKernel.Publication memory p) external {
        host = h;
        watchedRecord = recordId;
        oldRecords = h.counts().records;
        mode = m;
        nested = p;
    }

    function compileIntrinsic(bytes calldata raw) external view returns (Preparation.CompiledType memory) {
        return real.compileIntrinsic(raw);
    }

    function compileGroup(bytes calldata raw) external view returns (Preparation.CompiledGroup memory) {
        return real.compileGroup(raw);
    }

    function prepareRecord(
        bytes calldata cache,
        bytes32 typeId,
        bytes calldata body,
        bytes32 recordId,
        bytes32 principal,
        BindingFold.KernelIds calldata ids,
        bool bodyOnly
    ) external view returns (Preparation.PreparedRecord memory) {
        if (mode == 1 && host.record(watchedRecord).recordOrdinal != 0) {
            require(host.counts().records == oldRecords, "provisional row with old persisted count");
            revert ObservedProvisionalRecord();
        }
        return real.prepareRecord(cache, typeId, body, recordId, principal, ids, bodyOnly);
    }

    function deployCache(bytes calldata cache) external returns (address) {
        if (mode == 2) revert InjectedCacheFailure();
        if (mode >= 3 && !entered) {
            sawProvisionalCacheCallback =
                host.record(watchedRecord).recordOrdinal != 0 && host.counts().records == oldRecords;
            require(sawProvisionalCacheCallback, "replay also exposes provisional rows at cache callback");
            if (mode == 4) {
                entered = true;
                host.publishTrustedForTest(StateKernel.VerifiedContext(nested.header.principalId, 1, 0, 0), nested);
                entered = false;
            }
        }
        // CREATE remains from THIS helper's account, as with the pinned helper.
        (bool ok, bytes memory out) = address(real).delegatecall(abi.encodeCall(real.deployCache, (cache)));
        if (!ok) assembly ("memory-safe") { revert(add(out, 32), mload(out)) }
        return abi.decode(out, (address));
    }
}

contract DirectApplyTest is StateKernelTest {
    VmDirect constant vd = VmDirect(address(uint160(uint256(keccak256("hevm cheat code")))));
    event log_named_bytes(string key, bytes value);
    event log_named_uint(string key, uint256 value);

    function direct() internal view returns (bool) {
        return vd.envOr("EFS_DIRECT_APPLY", true);
    }

    function replaceHost(address helper) internal returns (DirectHost host) {
        StateStore.Bootstrap memory b = h.bootstrap();
        host = new DirectHost(
            StateKernel.Init(b.realmId, b.initialRevisionId, b.intrinsicGroupBytes, groups[0], groups[1]), helper
        );
        h = host;
    }
    function emptyPublication() internal pure returns (StateKernel.Publication memory p) {}

    function tiny(uint8 discriminator) internal pure returns (bytes memory raw) {
        bytes memory blob =
            bytes.concat(hex"0001000154000000", bytes32(uint256(discriminator)), hex"0001000161010000000000000000");
        raw = abi.encodePacked(uint16(1), uint16(blob.length), blob);
    }

    function tinyLeaf(uint16 index, uint8 discriminator) internal view returns (StateKernel.SelectedLeaf memory) {
        bytes memory raw = tiny(discriminator);
        return StateKernel.SelectedLeaf(index, meta, abi.encodePacked(uint16(raw.length), raw));
    }

    function typeFor(uint8 discriminator) internal pure returns (bytes32) {
        return keccak256(
            abi.encode(
                keccak256("efs2/typeschema/1"),
                keccak256(abi.encode(keccak256("efs2/typeschema-group/1"), keccak256(tiny(discriminator)))),
                uint256(0)
            )
        );
    }

    function latePublication() internal view returns (StateKernel.Publication memory p) {
        StateKernel.SelectedLeaf[] memory leaves = new StateKernel.SelectedLeaf[](3);
        leaves[0] = tinyLeaf(0, 1);
        leaves[1] = tinyLeaf(1, 2);
        leaves[2] = StateKernel.SelectedLeaf(2, bytes32(uint256(765)), hex"01");
        return request(leaves, 700);
    }

    function exactFailure(StateKernel.Publication memory p, bytes memory expected) internal returns (uint256 attempts) {
        bytes32 beforeState = snapshot();
        address helper = h.preparationHelper();
        uint64 nonce = vd.getNonce(helper);
        VmAcceptance(address(vm)).record();
        (bool ok, bytes memory err) = address(h).call(abi.encodeCall(h.publishTrustedForTest, (verified(), p)));
        (, bytes32[] memory writes) = VmAcceptance(address(vm)).accesses(address(h));
        require(!ok && keccak256(err) == keccak256(expected), "exact error boundary");
        require(beforeState == snapshot(), "complete enumerable Core rollback");
        require(h.envelope(p.envelopeId).envelopeOrdinal == 0, "new envelope rollback");
        for (uint256 i; i < p.leaves.length; i++) {
            require(h.record(p.recordIds[i]).recordOrdinal == 0, "new record rollback");
            require(h.occurrence(p.envelopeId, uint16(i)).packed == 0, "new occurrence rollback");
        }
        require(vd.getNonce(helper) == nonce, "helper CREATE nonce rollback");
        for (uint256 i; i < 2; i++) {
            require(vd.computeCreateAddress(helper, nonce + i).code.length == 0, "new cache code rollback");
        }
        emit log_named_bytes("exact rejection", err);
        emit log_named_uint("attempted Core write slots", writes.length);
        return writes.length;
    }

    // RED on the journal: later validation happens before any tentative SSTORE.
    // Catches retaining the deferred path while claiming direct application.
    function testLateFailureAttemptsWritesButRollsBack() public {
        StateKernel.Publication memory p = latePublication();
        uint256 attempts = exactFailure(p, abi.encodeWithSelector(StateKernel.E_UNKNOWN_TYPE.selector, uint16(2)));
        require(
            h.typeRow(typeFor(1)).typeOrdinal == 0 && h.typeRow(typeFor(2)).typeOrdinal == 0,
            "tentative Type rows rolled back"
        );
        require(attempts > 0, "direct apply must attempt prefix writes before late failure");
    }

    function testAuthorizationAndTwoCacheDeploymentsRollbackTogether() public {
        DirectHost host = replaceHost(address(new PreparationHelper()));
        StateKernel.Publication memory p = latePublication();
        bytes32 beforeState = snapshot();
        uint64 helperNonce = vd.getNonce(h.preparationHelper());
        (bool ok, bytes memory err) = address(host).call(abi.encodeCall(host.authorized, (verified(), p)));
        require(
            !ok && keccak256(err) == keccak256(abi.encodeWithSelector(StateKernel.E_UNKNOWN_TYPE.selector, uint16(2))),
            "exact late error"
        );
        require(host.authorizationNonce() == 0 && beforeState == snapshot(), "Core and authorization rollback");
        require(vd.getNonce(h.preparationHelper()) == helperNonce, "helper nonce rollback");
        for (uint256 i; i < 2; i++) {
            require(
                vd.computeCreateAddress(h.preparationHelper(), helperNonce + i).code.length == 0, "cache code absent"
            );
            require(host.cachePointer(typeFor(uint8(i + 1))) == address(0), "cache pointer absent");
        }
    }

    function testMultipleGroupsCreateInOrderAndExistingTypesDoNotCreate() public {
        DirectHost host = replaceHost(address(new PreparationHelper()));
        uint64 nonce = vd.getNonce(h.preparationHelper());
        StateKernel.SelectedLeaf[] memory a = new StateKernel.SelectedLeaf[](2);
        a[0] = tinyLeaf(0, 1);
        a[1] = tinyLeaf(1, 2);
        h.publishTrustedForTest(verified(), request(a, 701));
        for (uint8 i; i < 2; i++) {
            bytes32 t = typeFor(i + 1);
            address pointer = host.cachePointer(t);
            require(pointer == vd.computeCreateAddress(h.preparationHelper(), nonce + i), "exact helper CREATE order");
            Preparation.CompiledGroup memory g = PreparationHelper(h.preparationHelper()).compileGroup(tiny(i + 1));
            require(
                keccak256(pointer.code) == keccak256(bytes.concat(hex"00", g.types[0].cacheBytes)),
                "exact deployed cache bytes"
            );
            require(h.typeRow(t).typeOrdinal == uint64(i + 2), "Type inventory order");
        }
        require(vd.getNonce(h.preparationHelper()) == nonce + 2, "exact successful helper nonce");
        h.publishTrustedForTest(verified(), request(a, 702));
        require(vd.getNonce(h.preparationHelper()) == nonce + 2, "existing Types do not redeploy");
    }

    function testCompoundCacheFailureVersusLaterUnknownTypeIsAllowlisted() public {
        ObservingPreparation helper = new ObservingPreparation();
        replaceHost(address(helper));
        StateKernel.Publication memory p = latePublication();
        helper.configure(h, p.recordIds[0], 2, emptyPublication());
        bytes memory expected = direct()
            ? abi.encodeWithSelector(Preparation.HelperDeploy.selector)
            : abi.encodeWithSelector(StateKernel.E_UNKNOWN_TYPE.selector, uint16(2));
        exactFailure(p, expected);
    }

    function testStateObservingPreparationDistinguishesProvisionalPrefix() public {
        ObservingPreparation helper = new ObservingPreparation();
        replaceHost(address(helper));
        StateKernel.SelectedLeaf[] memory a = new StateKernel.SelectedLeaf[](2);
        a[0] = tinyLeaf(0, 1);
        a[1] = tinyLeaf(1, 2);
        StateKernel.Publication memory p = request(a, 703);
        helper.configure(h, p.recordIds[0], 1, emptyPublication());
        if (direct()) {
            exactFailure(p, abi.encodeWithSelector(ObservingPreparation.ObservedProvisionalRecord.selector));
        } else {
            h.publishTrustedForTest(verified(), p);
            require(h.counts().records == 2, "journal preparation observes no provisional record");
        }
    }

    function testBothStrategiesExposePrefixToCacheCallback() public {
        ObservingPreparation helper = new ObservingPreparation();
        replaceHost(address(helper));
        StateKernel.SelectedLeaf[] memory a = new StateKernel.SelectedLeaf[](1);
        a[0] = tinyLeaf(0, 1);
        StateKernel.Publication memory p = request(a, 704);
        helper.configure(h, p.recordIds[0], 3, emptyPublication());
        h.publishTrustedForTest(verified(), p);
        require(helper.sawProvisionalCacheCallback(), "old count and provisional record observed even by replay");
    }

    function testReentrantAdmissionCannotSilentlyChangeStagedCounts() public {
        ObservingPreparation helper = new ObservingPreparation();
        replaceHost(address(helper));
        install();
        StateKernel.SelectedLeaf[] memory nestedLeaves = new StateKernel.SelectedLeaf[](1);
        nestedLeaves[0] = objectLeaf(0);
        StateKernel.Publication memory inner = request(nestedLeaves, 705);
        StateKernel.SelectedLeaf[] memory a = new StateKernel.SelectedLeaf[](1);
        a[0] = tinyLeaf(0, 1);
        StateKernel.Publication memory p = request(a, 706);
        helper.configure(h, p.recordIds[0], 4, inner);
        exactFailure(p, abi.encodeWithSignature("Panic(uint256)", 1));
        require(
            h.envelope(inner.envelopeId).envelopeOrdinal == 0 && h.record(inner.recordIds[0]).recordOrdinal == 0,
            "nested admission rollback"
        );
        require(!helper.sawProvisionalCacheCallback(), "callback state rollback");
    }
}
