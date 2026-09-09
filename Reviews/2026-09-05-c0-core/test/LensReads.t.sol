// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {LensPlan} from "../src/LensPlan.sol";
import {StateLensReads} from "../src/StateLensReads.sol";
import {StateKernel} from "../src/StateKernel.sol";
import {StateStore} from "../src/StateStore.sol";
import {BindingFold} from "../src/BindingFold.sol";
import {PreparationHelper} from "../src/PreparationHelper.sol";
import {AdmissionLibrary} from "../src/AdmissionLibrary.sol";
import {PointReadLibrary} from "../src/PointReadLibrary.sol";
import {QueryReadLibrary} from "../src/QueryReadLibrary.sol";
import {StorageByteView} from "../src/StorageByteView.sol";
import {LensReadHarness, SyntheticLensReadHarness} from "./LensReadHarness.sol";

interface VmLens {
    function readFile(string calldata) external view returns (string memory);
    function parseJsonString(string calldata, string calldata) external pure returns (string memory);
    function parseBytes(string calldata) external pure returns (bytes memory);
    function etch(address, bytes calldata) external;
    function roll(uint256) external;
    function record() external;
    function accesses(address) external returns (bytes32[] memory, bytes32[] memory);
    function prank(address) external;
}

/// @notice Real deployed STATICCALL consumer; gas deltas are marginal, not tx totals.
contract StaticLensConsumer {
    event Measured(uint256 first, uint256 second, bytes32 firstResult, bytes32 secondResult);

    function once(LensReadHarness host, bytes32 plan, bytes32 position) external {
        uint256 beforeGas = gasleft();
        LensPlan.ResolveResult memory r = host.resolve(plan, position);
        emit Measured(beforeGas - gasleft(), 0, keccak256(abi.encode(r)), 0);
    }

    function twice(LensReadHarness host, bytes32 plan, bytes32 position) external {
        uint256 beforeGas = gasleft();
        LensPlan.ResolveResult memory first = host.resolve(plan, position);
        uint256 firstGas = beforeGas - gasleft();
        beforeGas = gasleft();
        LensPlan.ResolveResult memory second = host.resolve(plan, position);
        uint256 secondGas = beforeGas - gasleft();
        emit Measured(firstGas, secondGas, keccak256(abi.encode(first)), keccak256(abi.encode(second)));
    }
}

contract AdminPinnedLensGate {
    address public immutable admin;
    LensReadHarness public immutable core;
    bytes32 public immutable expectedPurposeAndScope;
    bytes32 public approvedPlanRecordId;
    bytes32 public acceptedTarget;
    uint256 public actions;

    constructor(LensReadHarness host, bytes32 purpose) {
        admin = msg.sender;
        core = host;
        expectedPurposeAndScope = purpose;
    }

    function setApprovedPlan(bytes32 plan) external {
        require(msg.sender == admin, "only admin");
        (bool ok,) = core.validatePlan(plan);
        require(ok, "malformed plan");
        (, bytes memory b,) = core.getRecord(plan);
        bytes32 purpose;
        assembly ("memory-safe") { purpose := mload(add(b, 66)) }
        require(purpose == expectedPurposeAndScope, "purpose/scope");
        approvedPlanRecordId = plan;
    }

    function act(bytes32 position) external {
        (LensPlan.ResolvedTarget memory target,) = core.resolveStrict(approvedPlanRecordId, position, 2);
        require(target.targetKind == 1 && target.targetLeaf == 0, "not record");
        acceptedTarget = target.targetA;
        ++actions;
    }
}

abstract contract LensPlanFixture {
    bytes32 constant PLAN_TYPE = 0x05cc2a7f4eec5faff7e64f2f8374aca5f980d390fd4eee3b46c2f5c53853e61e;

    function body(uint16 n, uint8 combiner) internal pure returns (bytes memory b) {
        b = new bytes(98 + 64 * uint256(n));
        put16(b, 0, uint16(b.length - 2));
        b[2] = 0x01;
        b[3] = bytes1(combiner);
        put16(b, 8, n);
        if (combiner == 2) put16(b, 6, 1);
        put32(b, 66, keccak256("efs2/lens-semantics/b0/1"));
        for (uint16 i; i < n; ++i) {
            put32(b, 98 + 64 * uint256(i), bytes32(uint256(i + 1)));
        }
    }

    function put16(bytes memory b, uint256 at, uint16 v) internal pure {
        b[at] = bytes1(uint8(v >> 8));
        b[at + 1] = bytes1(uint8(v & 255));
    }

    function put32(bytes memory b, uint256 at, bytes32 v) internal pure {
        assembly ("memory-safe") { mstore(add(add(b, 32), at), v) }
    }

    function expectCode(bytes memory b, uint8 code) internal pure {
        require(LensPlan.validate(PLAN_TYPE, b) == code, "wrong structural precedence/code");
    }
}

contract LensPlanGrammarTest is LensPlanFixture {
    function testCanonicalSizesAndCap() public pure {
        expectCode(body(1, 0), 0);
        expectCode(body(8, 0), 0);
        expectCode(body(32, 0), 0);
        expectCode(body(64, 0), 0);
        expectCode(body(65, 0), 7);
        expectCode(body(0, 0), 7);
    }

    function testAllThirteenRejectCodesAndGlobalPrecedence() public pure {
        bytes memory b = body(2, 0);
        require(LensPlan.validate(bytes32(0), b) == 1, "type first");
        expectCode(hex"00", 2);
        b[0] = 0xff;
        expectCode(b, 2);
        b = body(2, 0);
        b[2] = 0x02;
        b[3] = 0xff;
        expectCode(b, 3);
        b = body(2, 0);
        b[3] = 0xff;
        b[4] = 0x80;
        expectCode(b, 4);
        b = body(2, 0);
        b[4] = 0x02;
        put16(b, 6, 1);
        expectCode(b, 5);
        b = body(2, 0);
        put16(b, 6, 1);
        expectCode(b, 6);
        b = body(0, 2);
        expectCode(b, 6);
        b = body(65, 0);
        expectCode(b, 7);
        b = body(2, 0);
        put32(b, 162, bytes32(uint256(1)));
        expectCode(b, 8);
        b = body(2, 1);
        put32(b, 162, bytes32(uint256(1)));
        put16(b, 194, 1);
        expectCode(b, 9);
        b = body(2, 0);
        b[5] = 0x01;
        expectCode(b, 10);
        b = body(2, 0);
        put16(b, 194, 1);
        expectCode(b, 11);
        b = body(2, 0);
        b[4] = 0x01;
        expectCode(b, 12);
        b = body(2, 0);
        b[141] = 0x01;
        expectCode(b, 13);
        // A later entry's higher-ranked fault beats an earlier entry's lower-ranked fault.
        b = body(2, 0);
        b[5] = 0x01;
        b[196] = 0x01;
        expectCode(b, 5);
        b = body(2, 0);
        put16(b, 130, 1);
        expectCode(b, 8);
    }

    function testEveryReservedByteAndAuthorityFloor() public pure {
        for (uint256 i; i < 162; ++i) {
            bool reserved = i == 5 || (i >= 10 && i < 34) || (i >= 142);
            if (!reserved) continue;
            bytes memory b = body(1, 0);
            b[i] = 0x01;
            expectCode(b, 10);
        }
        for (uint256 i = 132; i < 134; ++i) {
            bytes memory b = body(1, 0);
            b[i] = 0x01;
            expectCode(b, 5);
        }
        for (uint256 i = 134; i < 142; ++i) {
            bytes memory b = body(1, 0);
            b[i] = 0x01;
            expectCode(b, 13);
        }
    }

    function testPrefixAndSemanticProfileSeparation() public pure {
        expectCode(new bytes(97), 2);
        bytes memory b = body(1, 0);
        expectCode(bytes.concat(b, hex"00"), 2);
        put16(b, 0, 159);
        expectCode(b, 2);
        b = body(1, 0);
        put16(b, 8, 2);
        expectCode(b, 2);
        b = body(1, 0);
        put32(b, 66, bytes32(uint256(123)));
        expectCode(b, 0);
        b = body(2, 1);
        put16(b, 130, 1);
        put16(b, 194, 7);
        b[4] = 0x01;
        expectCode(b, 0);
    }
}

/// @notice Semantics/corruption fixtures are explicitly seeded. Node tests supply real admissions.
contract LensReadsTest is LensPlanFixture {
    VmLens constant vm = VmLens(address(uint160(uint256(keccak256("hevm cheat code")))));
    bytes32 constant POS = bytes32(uint256(77));
    bytes32 constant REV = keccak256("lens-fixture-revision");

    function deploy() internal returns (SyntheticLensReadHarness h) {
        string memory json = vm.readFile("../2026-09-05-mvp-build-start/type-inputs/artifacts.v1.json");
        bytes memory objectGroup = vm.parseBytes(string.concat("0x", vm.parseJsonString(json, ".groups[0].groupHex")));
        bytes memory kernelGroup = vm.parseBytes(string.concat("0x", vm.parseJsonString(json, ".groups[1].groupHex")));
        // Same ordinary intrinsic descriptor as the established read fixtures.
        bytes memory blob = abi.encodePacked(
            hex"0001001154797065536368656d6147726f75702f31000000",
            bytes32(0),
            hex"0001000a67726f75704279746573051ffe0000000000000000"
        );
        StateKernel.Init memory init = StateKernel.Init(
            keccak256("lens-fixture-realm"),
            REV,
            abi.encodePacked(uint16(1), uint16(blob.length), blob),
            objectGroup,
            kernelGroup
        );
        PreparationHelper helper = new PreparationHelper();
        h = new SyntheticLensReadHarness(
            init,
            address(helper),
            address(helper).codehash,
            address(AdmissionLibrary).codehash,
            address(PointReadLibrary).codehash,
            address(QueryReadLibrary).codehash
        );
    }

    function plan(SyntheticLensReadHarness h, uint16 n, uint8 combiner, uint16 k) internal returns (bytes32 id) {
        bytes memory b = body(n, combiner);
        put16(b, 6, k);
        if (combiner == 1) {
            for (uint16 i; i < n; ++i) {
                put16(b, 130 + 64 * uint256(i), i / 2);
            }
        }
        return h.seedPlanForTest(PLAN_TYPE, b);
    }

    function head(SyntheticLensReadHarness h, uint16 index, uint8 state, uint8 kind, bytes32 a, uint16 leaf) internal {
        BindingFold.Head memory value = BindingFold.Head(
            state, kind, state == 2 ? 1 : 0, state == 0 ? 0 : 1, state == 0 ? 0 : uint64(index + 1), a, leaf
        );
        h.seedHeadForTest(LensPlan.deriveBindingKey(bytes32(uint256(index + 1)), POS), value);
    }

    function check(
        LensPlan.ResolveResult memory r,
        LensPlan.Presence presence,
        uint16 present,
        uint16 agree,
        uint16 winner
    ) internal view {
        require(r.presence == presence && r.reasonCode == 0, "outcome");
        require(r.presentCount == present && r.agreeCount == agree && r.winnerIndex == winner, "counts/winner");
        require(
            r.basis.realmRevisionId == REV && r.basis.blockNumber == block.number && r.basis.admissionHigh == 100
                && r.basis.basisKind == 0,
            "basis"
        );
        if (presence != LensPlan.Presence.FOUND) {
            require(r.target.targetKind == 0 && r.target.targetA == 0 && r.target.targetLeaf == 0, "non-found target");
            require(r.winnerTier == 0 && r.winnerAdmissionOrdinal == 0, "non-found provenance");
        } else {
            require(r.winnerAdmissionOrdinal == winner + 1, "winner ordinal");
        }
    }

    function testT1T2T3ExactAndPartialConflict() public {
        SyntheticLensReadHarness h = deploy();
        bytes32 p = plan(h, 3, 0, 0);
        check(h.resolve(p, POS), LensPlan.Presence.ABSENT, 0, 0, 0xffff);
        head(h, 0, 1, 1, bytes32(uint256(11)), 0);
        check(h.resolve(p, POS), LensPlan.Presence.ABSENT, 1, 0, 0xffff);
        head(h, 1, 1, 1, bytes32(uint256(12)), 0);
        check(h.resolve(p, POS), LensPlan.Presence.CONFLICT, 2, 0, 0xffff);
        head(h, 1, 1, 1, bytes32(uint256(11)), 0);
        head(h, 2, 1, 1, bytes32(uint256(11)), 0);
        check(h.resolve(p, POS), LensPlan.Presence.FOUND, 3, 3, 0);
        head(h, 2, 2, 0, 0, 0);
        check(h.resolve(p, POS), LensPlan.Presence.ABSENT, 2, 0, 0xffff);
    }

    function testT4T5T6T7PriorityCompleteTierAndUnconsultedCorruption() public {
        SyntheticLensReadHarness h = deploy();
        bytes32 p = plan(h, 4, 1, 0);
        check(h.resolve(p, POS), LensPlan.Presence.ABSENT, 0, 0, 0xffff);
        head(h, 2, 1, 1, bytes32(uint256(11)), 0);
        LensPlan.ResolveResult memory r = h.resolve(p, POS);
        check(r, LensPlan.Presence.FOUND, 1, 1, 2);
        require(r.winnerTier == 1, "tier");
        head(h, 0, 1, 1, bytes32(uint256(12)), 0);
        h.corruptHeadForTest(LensPlan.deriveBindingKey(bytes32(uint256(3)), POS));
        check(h.resolve(p, POS), LensPlan.Presence.FOUND, 1, 1, 0);
        head(h, 1, 1, 1, bytes32(uint256(13)), 0);
        check(h.resolve(p, POS), LensPlan.Presence.CONFLICT, 2, 0, 0xffff);
        h.corruptHeadForTest(LensPlan.deriveBindingKey(bytes32(uint256(1)), POS));
        (bool planOk,) = h.validatePlan(p);
        require(planOk, "structural validation probed corrupt heads");
        (bool ok, bytes memory reason) = address(h).staticcall(abi.encodeCall(h.resolve, (p, POS)));
        require(!ok && bytes4(reason) == StorageByteView.ErrReadState.selector, "consulted corruption falls through");
    }

    function testT8T9T10ThresholdAndExactTargetEquality() public {
        SyntheticLensReadHarness h = deploy();
        bytes32 p = plan(h, 4, 2, 2);
        head(h, 0, 1, 1, bytes32(uint256(11)), 0);
        head(h, 1, 1, 2, bytes32(uint256(11)), 0);
        check(h.resolve(p, POS), LensPlan.Presence.ABSENT, 2, 0, 0xffff);
        head(h, 2, 1, 2, bytes32(uint256(11)), 0);
        check(h.resolve(p, POS), LensPlan.Presence.FOUND, 3, 2, 1);
        head(h, 3, 1, 1, bytes32(uint256(11)), 0);
        check(h.resolve(p, POS), LensPlan.Presence.CONFLICT, 4, 0, 0xffff);
        head(h, 2, 1, 2, bytes32(uint256(11)), 1);
        check(h.resolve(p, POS), LensPlan.Presence.FOUND, 4, 2, 0);
        p = plan(h, 4, 0, 0);
        check(h.resolve(p, POS), LensPlan.Presence.CONFLICT, 4, 0, 0xffff);
    }

    function testUnavailableMalformedUnsupportedAndMask() public {
        SyntheticLensReadHarness h = deploy();
        (bool ok, bytes memory reason) = address(h).staticcall(abi.encodeCall(h.resolve, (bytes32(0), POS)));
        require(!ok && bytes4(reason) == StateLensReads.PlanUnavailable.selector, "missing plan");
        bytes32 p = h.seedPlanForTest(bytes32(uint256(123)), body(1, 0));
        (ok,) = h.validatePlan(p);
        require(!ok, "wrong type");
        (ok, reason) = address(h).staticcall(abi.encodeCall(h.resolve, (p, POS)));
        require(
            !ok
                && keccak256(reason)
                    == keccak256(abi.encodeWithSelector(StateLensReads.PlanMalformed.selector, p, uint8(1))),
            "bad type error"
        );
        bytes memory b = body(1, 0);
        b[2] = 0x02;
        p = h.seedPlanForTest(PLAN_TYPE, b);
        (, uint8 code) = h.validatePlan(p);
        require(code == 3, "malformed");
        b = body(1, 0);
        put32(b, 66, bytes32(uint256(3)));
        p = h.seedPlanForTest(PLAN_TYPE, b);
        (ok, code) = h.validatePlan(p);
        require(ok && code == 0, "unsupported is structural");
        LensPlan.ResolveResult memory r = h.resolve(p, POS);
        require(
            r.presence == LensPlan.Presence.UNSUPPORTED && r.reasonCode == 1 && r.winnerIndex == 0xffff, "unsupported"
        );
        (ok, reason) = address(h).staticcall(abi.encodeCall(h.resolveStrict, (p, POS, uint8(2))));
        require(
            !ok
                && keccak256(reason)
                    == keccak256(
                        abi.encodeWithSelector(StateLensReads.ResolveNotAccepted.selector, uint8(4), uint8(1))
                    ),
            "strict rejection"
        );
        (, r) = h.resolveStrict(p, POS, 16);
        require(r.presence == LensPlan.Presence.UNSUPPORTED, "exact mask machinery");
    }

    function testDependencyRefusalPrecedesStateAndPreparationIsNotCalled() public {
        SyntheticLensReadHarness h = deploy();
        bytes32 p = plan(h, 1, 0, 0);
        vm.etch(h.preparationHelper(), hex"60006000fd");
        vm.record();
        h.resolve(p, POS);
        h.validatePlan(p);
        h.resolveStrict(p, POS, 4);
        (, bytes32[] memory writes) = vm.accesses(address(h));
        require(writes.length == 0, "read wrote Store");
        vm.etch(h.queryReadLibrary(), hex"60006000fd");
        for (uint256 i; i < 3; ++i) {
            bytes memory data = i == 0
                ? abi.encodeCall(h.resolve, (bytes32(0), POS))
                : i == 1
                    ? abi.encodeCall(h.resolveStrict, (bytes32(0), POS, uint8(2)))
                    : abi.encodeCall(h.validatePlan, (bytes32(0)));
            (bool ok, bytes memory reason) = address(h).staticcall(data);
            require(
                !ok && keccak256(reason) == keccak256(abi.encodeWithSignature("ReadCodeMismatch(uint8)", uint8(2))),
                "guard precedence"
            );
        }
        vm.etch(h.queryReadLibrary(), hex"");
        (bool missingOk,) = address(h).staticcall(abi.encodeCall(h.resolve, (p, POS)));
        require(!missingOk, "missing Query");
        require(
            h.deriveBindingKey(bytes32(uint256(1)), POS) == LensPlan.deriveBindingKey(bytes32(uint256(1)), POS),
            "pure guard-free helper"
        );
    }

    function testAlteredBodyIdentityAndBlockNarrowing() public {
        SyntheticLensReadHarness h = deploy();
        bytes32 p = plan(h, 1, 0, 0);
        h.corruptBodyForTest(p);
        (bool ok, bytes memory reason) = address(h).staticcall(abi.encodeCall(h.resolve, (p, POS)));
        require(!ok && bytes4(reason) == StorageByteView.ErrReadState.selector, "altered body accepted");
        p = plan(h, 2, 0, 0);
        vm.roll(uint256(type(uint64).max) + 1);
        (ok, reason) = address(h).staticcall(abi.encodeCall(h.resolve, (p, POS)));
        require(!ok && bytes4(reason) == StorageByteView.ErrReadState.selector, "block narrowing");
    }
}
