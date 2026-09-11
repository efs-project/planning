// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import {StateKernelTest} from "./StateKernel.t.sol";
import {StatefulHarness} from "./StatefulHarness.sol";
import {StateStore} from "../src/StateStore.sol";
import {StateKernel} from "../src/StateKernel.sol";
import {Preparation} from "../src/Preparation.sol";
import {AdmissionLibrary} from "../src/AdmissionLibrary.sol";
import {PreparationHelper} from "../src/PreparationHelper.sol";
import {BindingFold} from "../src/BindingFold.sol";

interface VmLink {
    function etch(address target, bytes calldata code) external;
}

/// @notice Mutable TEST-ONLY fault injection behind a pinned codehash.
/// Not a production pure helper or evidence that malicious preparation is safe.
contract SelfRefPreparationForTest {
    PreparationHelper immutable real;
    bytes32 private faultRecord;
    bytes32 private faultEnvelope;
    uint16 private faultLeaf;
    uint8 private faultPosition;
    bool public rejectGroup;

    constructor(address helper) {
        real = PreparationHelper(helper);
    }

    function configure(bytes32 recordId, bytes32 envelopeId, uint16 leaf, uint8 position) external {
        faultRecord = recordId;
        faultEnvelope = envelopeId;
        faultLeaf = leaf;
        faultPosition = position;
    }

    // Cache deployment is forwarded to the real helper (deployed from ITS account).
    function deployCache(bytes memory cache) external returns (address) {
        return real.deployCache(cache);
    }

    function compileIntrinsic(bytes memory raw) external view returns (Preparation.CompiledType memory) {
        return real.compileIntrinsic(raw);
    }

    function refuseGroups(bool refuse) external {
        rejectGroup = refuse;
    }

    function compileGroup(bytes memory raw) external view returns (Preparation.CompiledGroup memory) {
        require(!rejectGroup, "synthetic group compilation refused");
        return real.compileGroup(raw);
    }

    function prepareRecord(
        bytes memory cache,
        bytes32 typeId,
        bytes memory body,
        bytes32 recordId,
        bytes32 principal,
        BindingFold.KernelIds memory ids,
        bool bodyOnly
    ) external view returns (Preparation.PreparedRecord memory r) {
        r = real.prepareRecord(cache, typeId, body, recordId, principal, ids, bodyOnly);
        if (recordId == faultRecord) {
            r.references = new Preparation.PreparedRef[](3);
            for (uint8 i; i < 3; ++i) {
                r.references[i] =
                    Preparation.PreparedRef(
                    i, 4, 0, i == faultPosition ? faultEnvelope : bytes32(uint256(65536)), faultLeaf
                );
            }
        }
    }
}

contract LinkedAdmissionTest is StateKernelTest {
    // A literal body self-OCCREF would require a Record/Envelope hash fixed
    // point. These test the defense-in-depth Core seam, not reachable valid
    // self-referencing bytes. Carriage/commitments and retained state stay real.
    function testSyntheticSelfOccurrenceGuardFreshMixedAndAllActive() public {
        SelfRefPreparationForTest injected = new SelfRefPreparationForTest(h.preparationHelper());
        StateStore.Bootstrap memory b = h.bootstrap();
        h = new StatefulHarness(
            StateKernel.Init(b.realmId, b.initialRevisionId, b.intrinsicGroupBytes, groups[0], groups[1]),
            address(injected),
            address(injected).codehash,
            address(AdmissionLibrary).codehash
        );
        h.publishTrustedForTest(verified(), oneGroup(201));
        StateKernel.SelectedLeaf[] memory a = new StateKernel.SelectedLeaf[](2);
        a[0] = objectLeaf(0);
        a[1] = objectLeaf(1);
        StateKernel.Publication memory p = request(a, 202);
        for (uint8 phase; phase < 3; ++phase) {
            for (uint8 position; position < 3; ++position) {
                injected.configure(p.recordIds[0], p.envelopeId, 1, position);
                bytes32 beforeState = snapshot();
                (bool ok, bytes memory err) = address(h).call(abi.encodeCall(h.publishTrustedForTest, (verified(), p)));
                require(
                    !ok
                        && keccak256(err)
                            == keccak256(
                                abi.encodeWithSelector(
                                    StateKernel.E_SELF_ENVELOPE_OCCREF.selector, uint16(0), uint16(1)
                                )
                            ),
                    "exact synthetic self-OCCREF refusal"
                );
                require(beforeState == snapshot(), "synthetic guard whole-state rollback");
            }
            injected.configure(0, 0, 0, 0);
            if (phase == 0) {
                StateKernel.Publication memory selectedPart = abi.decode(abi.encode(p), (StateKernel.Publication));
                selectedPart.leafMask = 1;
                selectedPart.leaves = new StateKernel.SelectedLeaf[](1);
                selectedPart.leaves[0] = a[0];
                h.publishTrustedForTest(verified(), selectedPart);
            } else if (phase == 1) {
                h.publishTrustedForTest(verified(), p);
            }
        }
    }

    function testActiveGroupRetryDoesNotCompileGroupOrCheckDependencies() public {
        SelfRefPreparationForTest injected = new SelfRefPreparationForTest(h.preparationHelper());
        StateStore.Bootstrap memory b = h.bootstrap();
        h = new StatefulHarness(
            StateKernel.Init(b.realmId, b.initialRevisionId, b.intrinsicGroupBytes, groups[0], groups[1]),
            address(injected),
            address(injected).codehash,
            address(AdmissionLibrary).codehash
        );
        StateKernel.SelectedLeaf[] memory a = new StateKernel.SelectedLeaf[](2);
        a[0] = groupLeaf(0, 0);
        a[1] = objectLeaf(1);
        StateKernel.Publication memory p = request(a, 203);
        StateKernel.Publication memory selectedPart = abi.decode(abi.encode(p), (StateKernel.Publication));
        selectedPart.leafMask = 1;
        selectedPart.leaves = new StateKernel.SelectedLeaf[](1);
        selectedPart.leaves[0] = a[0];
        h.publishTrustedForTest(verified(), selectedPart);
        injected.refuseGroups(true);
        bytes32 beforeState = snapshot();
        StateKernel.AdmitResult memory r = h.publishTrustedForTest(verified(), selectedPart);
        require(r.acceptingBatchId == 0 && beforeState == snapshot(), "all ACTIVE group skips compilation");
        r = h.publishTrustedForTest(verified(), p);
        require(r.leaves[0].outcome == 2 && r.leaves[1].outcome == 1, "mixed ACTIVE group skips compilation");
    }

    function fresh(bytes32 libraryHash) internal returns (StatefulHarness) {
        StateStore.Bootstrap memory b = h.bootstrap();
        return new StatefulHarness(
            StateKernel.Init(b.realmId, b.initialRevisionId, b.intrinsicGroupBytes, groups[0], groups[1]),
            h.preparationHelper(),
            h.preparationCodehash(),
            libraryHash
        );
    }

    function oneGroup(uint256 salt) internal view returns (StateKernel.Publication memory) {
        StateKernel.SelectedLeaf[] memory a = new StateKernel.SelectedLeaf[](1);
        a[0] = groupLeaf(0, 0);
        return request(a, salt);
    }

    function construct(bytes32 expectedHash) external returns (StatefulHarness) {
        return fresh(expectedHash);
    }

    // Invalid dependency identity must prevent an initialized host from existing.
    function testWrongExpectedLibraryHashRejectsBeforeMutation() public {
        bytes32 beforeState = snapshot();
        (bool ok, bytes memory reason) = address(this).call(abi.encodeCall(this.construct, (bytes32(uint256(1)))));
        require(
            !ok
                && keccak256(reason)
                    == keccak256(abi.encodeWithSelector(StatefulHarness.AdmissionCodeMismatch.selector)),
            "expected library hash guard"
        );
        require(beforeState == snapshot(), "wrong-hash whole state unchanged");
    }

    function testMissingLibraryRejectsConstruction() public {
        address target = address(AdmissionLibrary);
        bytes memory original = target.code;
        VmLink(address(vm)).etch(target, hex"");
        (bool ok, bytes memory reason) = address(this).call(abi.encodeCall(this.construct, (target.codehash)));
        VmLink(address(vm)).etch(target, original);
        require(
            !ok
                && keccak256(reason)
                    == keccak256(abi.encodeWithSelector(StatefulHarness.AdmissionCodeMismatch.selector)),
            "nonempty library required at construction"
        );
    }

    function testPreparationIdentityRejectsBeforeInitialization() public {
        address target = h.preparationHelper();
        bytes memory original = target.code;
        VmLink(address(vm)).etch(target, hex"00");
        (bool ok, bytes memory reason) =
            address(this).call(abi.encodeCall(this.construct, (address(AdmissionLibrary).codehash)));
        VmLink(address(vm)).etch(target, original);
        require(
            !ok && keccak256(reason) == keccak256(abi.encodeWithSelector(Preparation.HelperIdentity.selector)),
            "preparation identity before initialization"
        );
    }

    // Synthetic runtime mutation exercises the EVERY-call check, including post-success.
    function testMissingAndChangedLibraryCodeRejectBeforeMutation() public {
        h.publishTrustedForTest(verified(), oneGroup(102));
        bytes32 beforeState = snapshot();
        address target = h.admissionLibrary();
        bytes memory original = target.code;
        VmLink(address(vm)).etch(target, hex"");
        (bool ok, bytes memory reason) =
            address(h).call(abi.encodeCall(h.publishTrustedForTest, (verified(), oneGroup(103))));
        require(
            !ok
                && keccak256(reason)
                    == keccak256(abi.encodeWithSelector(StatefulHarness.AdmissionCodeMismatch.selector)),
            "missing linked code"
        );
        require(beforeState == snapshot(), "missing-code whole state unchanged");
        VmLink(address(vm)).etch(target, hex"00");
        (ok, reason) = address(h).call(abi.encodeCall(h.publishTrustedForTest, (verified(), oneGroup(104))));
        VmLink(address(vm)).etch(target, original);
        require(
            !ok
                && keccak256(reason)
                    == keccak256(abi.encodeWithSelector(StatefulHarness.AdmissionCodeMismatch.selector)),
            "changed linked code"
        );
        require(beforeState == snapshot(), "changed-code whole state unchanged");
    }

    function testTwoCoreInstancesUseTheirOwnStore() public {
        StatefulHarness first = h;
        StatefulHarness second = fresh(address(AdmissionLibrary).codehash);
        require(
            first.admissionLibrary() == address(AdmissionLibrary)
                && second.admissionLibrary() == address(AdmissionLibrary),
            "actual compiler link target"
        );
        bytes32 beforeFirst = snapshot();
        h = second;
        bytes32 beforeSecond = snapshot();
        h = first;
        StateKernel.Publication memory p = oneGroup(105);
        StateKernel.AdmitResult memory a = first.publishTrustedForTest(verified(), p);
        require(snapshot() != beforeFirst, "first changed");
        bytes32 afterFirst = snapshot();
        h = second;
        require(snapshot() == beforeSecond, "second untouched by first");
        StateKernel.AdmitResult memory b = second.publishTrustedForTest(verified(), p);
        require(
            a.envelopeOrdinal == 1 && b.envelopeOrdinal == 1 && a.acceptingBatchId == 1 && b.acceptingBatchId == 1,
            "independent counters"
        );
        require(keccak256(abi.encode(a)) == keccak256(abi.encode(b)), "same initial exact outcomes");
        require(snapshot() == afterFirst, "same publication independently reconstructs same state");
        h = first;
        require(snapshot() == afterFirst, "second did not mutate first");
    }

    function testDirectCallCannotEnterMutatingLibraryFunction() public {
        // Compiler supplies the library selector; storage-reference wire word is slot 0.
        bytes memory data = abi.encodeWithSelector(
            AdmissionLibrary.admit.selector,
            uint256(0),
            verified(),
            oneGroup(106),
            Preparation.Config(h.preparationHelper(), h.preparationCodehash())
        );
        bytes32 beforeState = snapshot();
        (bool ok, bytes memory reason) = address(AdmissionLibrary).call(data);
        require(!ok && reason.length == 0, "Solidity direct-CALL guard rejects before library body");
        require(snapshot() == beforeState, "Core unchanged");
    }

    function testHelperFailureBubblesAndRollsBackCore() public {
        bytes32 beforeState = snapshot();
        address target = h.preparationHelper();
        bytes memory original = target.code;
        VmLink(address(vm)).etch(target, hex"00");
        (bool ok, bytes memory reason) =
            address(h).call(abi.encodeCall(h.publishTrustedForTest, (verified(), oneGroup(107))));
        VmLink(address(vm)).etch(target, original);
        require(
            !ok && keccak256(reason) == keccak256(abi.encodeWithSelector(Preparation.HelperIdentity.selector)),
            "exact helper failure bubbles through library"
        );
        require(beforeState == snapshot(), "helper failure whole state unchanged");
    }
}
