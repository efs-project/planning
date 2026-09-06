// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {C0RunCodec as V1} from "C0Admission/../../2026-09-04-mvp-c0-foundation/src/C0RunCodec.sol";
import {C0RunCodecV2 as V2} from "../src/C0RunCodecV2.sol";
import {C0InitializationSelection as I} from "../src/C0InitializationSelection.sol";
import {C0BootstrapCodecHarness} from "./C0BootstrapCodecHarness.sol";

contract C0BootstrapCodecTest {
    C0BootstrapCodecHarness private h = new C0BootstrapCodecHarness();

    function selection() internal pure returns (I.Selection memory) {
        return I.Selection(
            1,
            2,
            1,
            0,
            bytes32(0),
            16_777_216,
            keccak256(abi.encode(keccak256("efs2/mvp-c0/null-policy/1"))),
            address(0x21)
        );
    }

    function selectionBytes() internal pure returns (bytes memory) {
        return abi.encode(
            keccak256("efs2/mvp-c0/initialization-selection/1"),
            uint16(1),
            uint8(2),
            uint32(1),
            uint8(0),
            bytes32(0),
            uint64(16_777_216),
            keccak256(abi.encode(keccak256("efs2/mvp-c0/null-policy/1"))),
            address(0x21)
        );
    }

    function sample() internal pure returns (V2.Seed memory s) {
        s.base.namespace = "efs2/mvp-c0/2026-09-03";
        s.base.runId = bytes32(uint256(1));
        s.base.sourceCommitments = new V1.Commitment[](2);
        s.base.sourceCommitments[0] = V1.Commitment("c0/init-selection/1", keccak256(selectionBytes()));
        s.base.sourceCommitments[1] = V1.Commitment("z", bytes32(uint256(3)));
        s.base.toolchainCommitments = new V1.Commitment[](1);
        s.base.toolchainCommitments[0] = V1.Commitment("node", bytes32(uint256(4)));
        s.base.chainConfigCommitment = bytes32(uint256(5));
        s.base.deploymentFactoryAddress = address(6);
        s.base.coreCreationCodeTemplateHash = bytes32(uint256(7));
        s.base.byteStoreCreationCodeTemplateHash = bytes32(uint256(8));
        s.base.codexConstantsHash = bytes32(uint256(9));
        s.base.indexCapabilityRoot = bytes32(uint256(10));
        s.base.orderedTypeGroupRoot = bytes32(uint256(11));
        s.base.schemaAuthorAddress = address(12);
        s.base.bootstrapAuthorAddress = address(13);
        s.base.byteMeasurementReportHash = bytes32(uint256(14));
        s.base.maxStateFileBytes = 8192;
        s.base.maxReadRangeBytes = 4096;
        s.base.stateGrowthMargin = 1;
        s.base.destructionPolicyHash = bytes32(uint256(15));
        s.admissionCreationCodeTemplateHash = bytes32(uint256(16));
        s.preparationCreationCodeTemplateHash = bytes32(uint256(17));
        s.coreLinkReferencesHash = bytes32(uint256(18));
    }

    function seedBytes() internal pure returns (bytes memory) {
        return bytes.concat(
            hex"0002",
            hex"0016656673322f6d76702d63302f323032362d30392d3033",
            bytes32(uint256(1)),
            hex"000200000035001363302f696e69742d73656c656374696f6e2f31",
            keccak256(selectionBytes()),
            hex"0000002300017a",
            bytes32(uint256(3)),
            hex"00010000002600046e6f6465",
            bytes32(uint256(4)),
            bytes32(uint256(5)),
            bytes20(address(6)),
            bytes32(0),
            bytes32(0),
            bytes32(uint256(7)),
            bytes32(uint256(8)),
            bytes32(uint256(9)),
            bytes32(uint256(10)),
            bytes32(uint256(11)),
            bytes20(address(12)),
            bytes20(address(13)),
            bytes32(uint256(14)),
            hex"0000000000002000000000000000100000000000000000000000000000000001",
            bytes32(uint256(15)),
            bytes32(0),
            bytes32(0),
            bytes32(uint256(16)),
            bytes32(uint256(17)),
            bytes32(uint256(18))
        );
    }

    function deployment() internal pure returns (V2.Deployment memory d) {
        d.experimentSeed = bytes32(uint256(1));
        d.core = V2.Component(address(0x31), bytes32(0), bytes32(uint256(41)), bytes32(uint256(42)));
        d.byteStore = V2.Component(address(0x32), bytes32(0), bytes32(uint256(43)), bytes32(uint256(44)));
        d.admissionLibrary = V2.Component(address(0x33), bytes32(0), bytes32(uint256(45)), bytes32(uint256(46)));
        d.preparationHelper = V2.Component(address(0x34), bytes32(0), bytes32(uint256(47)), bytes32(uint256(48)));
    }

    function deploymentBytes() internal pure returns (bytes memory) {
        return bytes.concat(
            hex"0002",
            bytes32(uint256(1)),
            bytes20(address(0x31)),
            bytes32(0),
            bytes32(uint256(41)),
            bytes32(uint256(42)),
            bytes20(address(0x32)),
            bytes32(0),
            bytes32(uint256(43)),
            bytes32(uint256(44)),
            bytes20(address(0x33)),
            bytes32(0),
            bytes32(uint256(45)),
            bytes32(uint256(46)),
            bytes20(address(0x34)),
            bytes32(0),
            bytes32(uint256(47)),
            bytes32(uint256(48))
        );
    }

    function equal(bytes memory actual, bytes memory expected, string memory reason) internal pure {
        require(actual.length == expected.length && keccak256(actual) == keccak256(expected), reason);
    }

    function reject(bytes memory data, bytes4 selector, string memory reason) internal view {
        (bool ok, bytes memory result) = address(h).staticcall(data);
        require(!ok, reason);
        require(result.length >= 4 && bytes4(result) == selector, "wrong refusal selector");
    }

    function rejectSeed(bytes memory encoded) internal view {
        (bool ok,) = address(h).staticcall(abi.encodeCall(h.decodeSeed, (encoded)));
        require(!ok, "invalid V2 seed accepted");
    }

    function rejectDeployment(bytes memory encoded) internal view {
        reject(
            abi.encodeCall(h.decodeDeployment, (encoded)), V2.InvalidRunV2.selector, "invalid V2 deployment accepted"
        );
    }

    function rejectSelection(bytes memory encoded) internal view {
        reject(
            abi.encodeCall(h.decodeSelection, (encoded)),
            I.InvalidInitializationSelection.selector,
            "invalid selection accepted"
        );
    }

    function prefix(bytes memory value, uint256 length) internal pure returns (bytes memory out) {
        out = new bytes(length);
        for (uint256 i; i < length; ++i) {
            out[i] = value[i];
        }
    }

    function testSelectionMatchesIndependentAbiFixture() public view {
        bytes memory expected = selectionBytes();
        require(expected.length == 288, "selection fixture width");
        equal(h.encodeSelection(selection()), expected, "selection fixture bytes");
        require(
            keccak256(abi.encode(h.decodeSelection(expected))) == keccak256(abi.encode(selection())), "selection decode"
        );
        require(
            keccak256(h.nullPolicyBytes()) == keccak256(abi.encode(keccak256("efs2/mvp-c0/null-policy/1"))),
            "null policy bytes"
        );
    }

    function testSeedMatchesHandPackedV1WrapperAndDomains() public view {
        V2.Seed memory s = sample();
        bytes memory expected = seedBytes();
        require(expected.length == 772, "compact seed fixture width");
        equal(h.encodeSeed(s), expected, "V2 seed fixture bytes");
        require(keccak256(abi.encode(h.decodeSeed(expected))) == keccak256(abi.encode(s)), "V2 seed decode");
        require(h.selectionDigest(s) == keccak256(selectionBytes()), "reserved selection digest");
        require(
            h.experimentSeed(s)
                == keccak256(abi.encode(keccak256("efs2/mvp-c0/experiment-seed/2"), keccak256(expected))),
            "V2 seed domain"
        );
    }

    function testDeploymentMatchesHandPackedFrameAndDomains() public view {
        V2.Deployment memory d = deployment();
        bytes memory expected = deploymentBytes();
        require(expected.length == 498, "deployment fixture width");
        equal(h.encodeDeployment(d), expected, "deployment fixture bytes");
        require(keccak256(abi.encode(h.decodeDeployment(expected))) == keccak256(abi.encode(d)), "deployment decode");
        bytes32 commitment = keccak256(
            abi.encode(keccak256("efs2/mvp-c0/experiment-deployment/2"), bytes32(uint256(1)), keccak256(expected))
        );
        require(h.experimentCommitment(d) == commitment, "deployment domain");
        require(
            h.c0ProfileId(commitment) == keccak256(abi.encode(keccak256("efs2/mvp-c0/profile/1"), commitment)),
            "profile domain"
        );
    }

    function testAllCompactFrameTruncationsAndTrailingBytesRefuse() public view {
        bytes memory s = seedBytes();
        bytes memory d = deploymentBytes();
        bytes memory x = selectionBytes();
        for (uint256 i; i < s.length; ++i) {
            rejectSeed(prefix(s, i));
        }
        for (uint256 i; i < d.length; ++i) {
            rejectDeployment(prefix(d, i));
        }
        for (uint256 i; i < x.length; ++i) {
            rejectSelection(prefix(x, i));
        }
        rejectSeed(bytes.concat(s, hex"00"));
        rejectDeployment(bytes.concat(d, hex"00"));
        rejectSelection(bytes.concat(x, hex"00"));
    }

    function testV1AndV2FramesCrossReject() public view {
        (bool ok,) = address(h).staticcall(abi.encodeCall(h.decodeSeedV1, (seedBytes())));
        require(!ok, "V1 accepted V2 seed");
        (ok,) = address(h).staticcall(abi.encodeCall(h.decodeDeploymentV1, (deploymentBytes())));
        require(!ok, "V1 accepted V2 deployment");
        bytes memory wrapped = seedBytes();
        bytes memory v1Seed = new bytes(wrapped.length - 162);
        for (uint256 i; i < v1Seed.length; ++i) {
            v1Seed[i] = wrapped[i + 2];
        }
        rejectSeed(v1Seed);
        V1.Deployment memory old = V1.Deployment(
            bytes32(uint256(1)),
            address(2),
            0,
            bytes32(uint256(3)),
            bytes32(uint256(4)),
            address(5),
            0,
            bytes32(uint256(6)),
            bytes32(uint256(7))
        );
        rejectDeployment(
            abi.encodePacked(
                old.experimentSeed,
                old.coreAddress,
                old.coreCreate2Salt,
                old.coreInitCodeHash,
                old.coreRuntimeCodeHash,
                old.byteStoreAddress,
                old.byteStoreCreate2Salt,
                old.byteStoreInitCodeHash,
                old.byteStoreRuntimeCodeHash
            )
        );
    }

    function testSeedOuterGuardSuffixAndReservedEntryRules() public view {
        bytes memory b = seedBytes();
        b[1] = 0x03;
        rejectSeed(b);
        for (uint256 wordIndex = 2; wordIndex < 5; ++wordIndex) {
            b = seedBytes();
            uint256 offset = b.length - 160 + wordIndex * 32;
            for (uint256 j; j < 32; ++j) {
                b[offset + j] = 0;
            }
            rejectSeed(b);
        }
        V2.Seed memory s = sample();
        s.base.sourceCommitments[0].label = "b";
        reject(abi.encodeCall(h.encodeSeed, (s)), V2.InvalidRunV2.selector, "missing reserved label accepted");
        s = sample();
        s.base.sourceCommitments = new V1.Commitment[](3);
        s.base.sourceCommitments[0] = V1.Commitment("c0/init-selection/1", bytes32(uint256(1)));
        s.base.sourceCommitments[1] = V1.Commitment("c0/init-selection/1", bytes32(uint256(2)));
        s.base.sourceCommitments[2] = V1.Commitment("z", bytes32(uint256(3)));
        (bool ok,) = address(h).staticcall(abi.encodeCall(h.encodeSeed, (s)));
        require(!ok, "duplicate reserved label accepted");

        bytes32 original = h.experimentSeed(sample());
        for (uint256 i; i < 5; ++i) {
            s = sample();
            if (i == 0) s.admissionLibraryCreate2Salt = bytes32(uint256(99));
            if (i == 1) s.preparationHelperCreate2Salt = bytes32(uint256(99));
            if (i == 2) s.admissionCreationCodeTemplateHash = bytes32(uint256(99));
            if (i == 3) s.preparationCreationCodeTemplateHash = bytes32(uint256(99));
            if (i == 4) s.coreLinkReferencesHash = bytes32(uint256(99));
            require(h.experimentSeed(s) != original, "seed suffix field unbound");
        }
    }

    function minimalSeed() internal pure returns (V2.Seed memory s) {
        s = sample();
        s.base.sourceCommitments = new V1.Commitment[](1);
        s.base.sourceCommitments[0] = V1.Commitment("c0/init-selection/1", keccak256(selectionBytes()));
        s.base.toolchainCommitments[0].label = "a";
    }

    function maximumSeed() internal pure returns (V2.Seed memory s) {
        s = sample();
        s.base.sourceCommitments = new V1.Commitment[](64);
        s.base.sourceCommitments[0] = V1.Commitment("c0/init-selection/1", keccak256(selectionBytes()));
        for (uint256 i = 1; i < 64; ++i) {
            bytes memory label = new bytes(64);
            for (uint256 j; j < 64; ++j) {
                label[j] = 0x7a;
            }
            label[0] = 0x64;
            label[1] = bytes1(uint8(48 + i / 10));
            label[2] = bytes1(uint8(48 + i % 10));
            s.base.sourceCommitments[i] = V1.Commitment(string(label), bytes32(i + 1));
        }
        s.base.toolchainCommitments = new V1.Commitment[](64);
        for (uint256 i; i < 64; ++i) {
            bytes memory label = new bytes(64);
            for (uint256 j; j < 64; ++j) {
                label[j] = 0x7a;
            }
            label[0] = 0x61;
            label[1] = bytes1(uint8(48 + i / 10));
            label[2] = bytes1(uint8(48 + i % 10));
            s.base.toolchainCommitments[i] = V1.Commitment(string(label), bytes32(i + 100));
        }
    }

    function testRequiredLabelNarrowsValidSeedExtrema() public view {
        bytes memory minimum = h.encodeSeed(minimalSeed());
        require(minimum.length == 730, "required-label minimum");
        h.decodeSeed(minimum);
        bytes memory maximum = h.encodeSeed(maximumSeed());
        require(maximum.length == 13_645, "required-label maximum");
        h.decodeSeed(maximum);
        bytes memory padded = bytes.concat(maximum, new bytes(45));
        require(padded.length == 13_690, "outer grammar ceiling fixture");
        rejectSeed(padded);
        rejectSeed(bytes.concat(padded, hex"00"));
    }

    function testBaseV1CountLabelAndUnsignedOrderStillApply() public view {
        V2.Seed memory s = minimalSeed();
        s.base.toolchainCommitments[0].label = string(new bytes(65));
        (bool ok,) = address(h).staticcall(abi.encodeCall(h.encodeSeed, (s)));
        require(!ok, "65-byte label accepted");
        s = minimalSeed();
        s.base.toolchainCommitments = new V1.Commitment[](65);
        (ok,) = address(h).staticcall(abi.encodeCall(h.encodeSeed, (s)));
        require(!ok, "65 entries accepted");
        s = minimalSeed();
        s.base.sourceCommitments = new V1.Commitment[](3);
        s.base.sourceCommitments[0] = V1.Commitment("-", bytes32(uint256(1)));
        s.base.sourceCommitments[1] = V1.Commitment("A", bytes32(uint256(2)));
        s.base.sourceCommitments[2] = V1.Commitment("c0/init-selection/1", keccak256(selectionBytes()));
        h.decodeSeed(h.encodeSeed(s));
        s.base.sourceCommitments[0].label = "A";
        s.base.sourceCommitments[1].label = "-";
        (ok,) = address(h).staticcall(abi.encodeCall(h.encodeSeed, (s)));
        require(!ok, "descending unsigned order accepted");
    }

    function testDeploymentVersionRequiredFieldsAndAllAddressPairs() public view {
        bytes memory b = deploymentBytes();
        b[1] = 0x01;
        rejectDeployment(b);
        V2.Deployment memory d = deployment();
        d.experimentSeed = 0;
        reject(abi.encodeCall(h.encodeDeployment, (d)), V2.InvalidRunV2.selector, "zero seed accepted");
        for (uint256 componentIndex; componentIndex < 4; ++componentIndex) {
            for (uint256 hashIndex; hashIndex < 2; ++hashIndex) {
                d = deployment();
                if (componentIndex == 0 && hashIndex == 0) d.core.initCodeHash = 0;
                if (componentIndex == 0 && hashIndex == 1) d.core.runtimeCodeHash = 0;
                if (componentIndex == 1 && hashIndex == 0) d.byteStore.initCodeHash = 0;
                if (componentIndex == 1 && hashIndex == 1) d.byteStore.runtimeCodeHash = 0;
                if (componentIndex == 2 && hashIndex == 0) d.admissionLibrary.initCodeHash = 0;
                if (componentIndex == 2 && hashIndex == 1) d.admissionLibrary.runtimeCodeHash = 0;
                if (componentIndex == 3 && hashIndex == 0) d.preparationHelper.initCodeHash = 0;
                if (componentIndex == 3 && hashIndex == 1) d.preparationHelper.runtimeCodeHash = 0;
                reject(abi.encodeCall(h.encodeDeployment, (d)), V2.InvalidRunV2.selector, "zero code hash accepted");
            }
        }
        address[4] memory accounts = [address(0x31), address(0x32), address(0x33), address(0x34)];
        for (uint256 left; left < 4; ++left) {
            for (uint256 right = left + 1; right < 4; ++right) {
                d = deployment();
                if (right == 1) d.byteStore.account = accounts[left];
                if (right == 2) d.admissionLibrary.account = accounts[left];
                if (right == 3) d.preparationHelper.account = accounts[left];
                reject(abi.encodeCall(h.encodeDeployment, (d)), V2.InvalidRunV2.selector, "duplicate account accepted");
            }
        }
        d = deployment();
        d.preparationHelper.account = address(0);
        reject(abi.encodeCall(h.encodeDeployment, (d)), V2.InvalidRunV2.selector, "zero account accepted");
    }

    function testEveryDeploymentFieldAffectsCommitment() public view {
        V2.Deployment memory original = deployment();
        bytes32 expected = h.experimentCommitment(original);
        for (uint256 i; i < 17; ++i) {
            V2.Deployment memory d = deployment();
            if (i == 0) d.experimentSeed = bytes32(uint256(99));
            V2.Component memory c =
                i <= 4 ? d.core : i <= 8 ? d.byteStore : i <= 12 ? d.admissionLibrary : d.preparationHelper;
            uint256 field = i == 0 ? 4 : (i - 1) % 4;
            if (field == 0) c.account = address(uint160(0x80 + i));
            if (field == 1) c.create2Salt = bytes32(uint256(0x80 + i));
            if (field == 2) c.initCodeHash = bytes32(uint256(0x80 + i));
            if (field == 3) c.runtimeCodeHash = bytes32(uint256(0x80 + i));
            if (i >= 1 && i <= 4) d.core = c;
            if (i >= 5 && i <= 8) d.byteStore = c;
            if (i >= 9 && i <= 12) d.admissionLibrary = c;
            if (i >= 13) d.preparationHelper = c;
            require(h.experimentCommitment(d) != expected, "deployment field unbound");
        }
        (bool ok,) = address(h).staticcall(abi.encodeCall(h.c0ProfileId, (bytes32(0))));
        require(!ok, "zero profile commitment accepted");
    }

    function testSelectionValidFinalityAndU64Boundaries() public view {
        for (uint8 kind; kind <= 3; ++kind) {
            I.Selection memory s = selection();
            s.finalityRuleKind = kind;
            s.finalityParam = kind == 2 ? 1 : 0;
            if (kind == 3) s.declaredTxGasLimit = type(uint64).max;
            I.Selection memory actual = h.decodeSelection(h.encodeSelection(s));
            require(actual.finalityRuleKind == kind && actual.finalityParam == s.finalityParam, "finality lost");
            require(actual.declaredTxGasLimit == s.declaredTxGasLimit, "u64 lost");
        }
    }

    function testSelectionRejectsInvalidValuesNoncanonicalWordsAndOpeningMismatch() public view {
        for (uint256 i; i < 10; ++i) {
            I.Selection memory s = selection();
            if (i == 0) s.initConfigVersion = 2;
            if (i == 1) s.finalityRuleKind = 4;
            if (i == 2) {
                s.finalityRuleKind = 2;
                s.finalityParam = 0;
            }
            if (i == 3) {
                s.finalityRuleKind = 1;
                s.finalityParam = 1;
            }
            if (i == 4) s.upgradeAuthorityKind = 1;
            if (i == 5) s.upgradeAuthorityRef = bytes32(uint256(1));
            if (i == 6) s.declaredTxGasLimit = 16_777_215;
            if (i == 7) s.nullPolicyHash = bytes32(uint256(1));
            if (i == 8) s.bootstrapExecutor = address(0);
            if (i == 9) s.finalityRuleKind = type(uint8).max;
            reject(
                abi.encodeCall(h.encodeSelection, (s)),
                I.InvalidInitializationSelection.selector,
                "invalid selection value accepted"
            );
        }
        bytes memory b = selectionBytes();
        b[0] ^= 0x01;
        rejectSelection(b);
        b = selectionBytes();
        b[32] = 0x01;
        (bool ok,) = address(h).staticcall(abi.encodeCall(h.decodeSelection, (b)));
        require(!ok, "noncanonical selection accepted");
        reject(
            abi.encodeCall(h.openSelection, (selectionBytes(), bytes32(0))),
            I.InvalidInitializationSelection.selector,
            "zero expected digest accepted"
        );
        reject(
            abi.encodeCall(h.openSelection, (selectionBytes(), bytes32(uint256(1)))),
            I.InvalidInitializationSelection.selector,
            "mismatched expected digest accepted"
        );
        require(
            keccak256(abi.encode(h.openSelection(selectionBytes(), keccak256(selectionBytes()))))
                == keccak256(abi.encode(selection())),
            "valid opening"
        );
    }

    function testInitConfigIsExactSevenWordTupleWithoutExecutor() public view {
        I.Selection memory s = selection();
        bytes32 deploymentCommitment = bytes32(uint256(0x99));
        bytes32 policy =
            keccak256(abi.encode(keccak256("efs2/mvp-c0/initial-policy/1"), s.nullPolicyHash, deploymentCommitment));
        bytes memory expected =
            abi.encode(uint16(1), uint8(2), uint32(1), uint8(0), bytes32(0), uint64(16_777_216), policy);
        require(expected.length == 224, "InitConfig fixture width");
        equal(h.initConfig(s, deploymentCommitment), expected, "InitConfig fixture bytes");
        h.requireInitConfig(expected, s, deploymentCommitment);
        I.Selection memory changedExecutor = selection();
        changedExecutor.bootstrapExecutor = address(0x22);
        equal(h.initConfig(changedExecutor, deploymentCommitment), expected, "executor leaked into InitConfig");
        require(
            keccak256(h.encodeSelection(changedExecutor)) != keccak256(selectionBytes()),
            "executor unbound in selection"
        );
        V2.Seed memory executorSeed = sample();
        executorSeed.base.sourceCommitments[0].digest = keccak256(h.encodeSelection(changedExecutor));
        require(h.experimentSeed(executorSeed) != h.experimentSeed(sample()), "executor mutation unbound in seed");
        require(
            h.openSelection(h.encodeSelection(changedExecutor), h.selectionDigest(executorSeed)).bootstrapExecutor
                == address(0x22),
            "executor selection opening"
        );
        for (uint256 i; i < 7; ++i) {
            bytes memory wrong = bytes.concat(expected);
            wrong[i * 32 + 31] ^= 0x01;
            reject(
                abi.encodeCall(h.requireInitConfig, (wrong, s, deploymentCommitment)),
                I.InvalidInitializationSelection.selector,
                "altered InitConfig accepted"
            );
        }
        reject(
            abi.encodeCall(h.requireInitConfig, (prefix(expected, 223), s, deploymentCommitment)),
            I.InvalidInitializationSelection.selector,
            "short InitConfig accepted"
        );
        reject(
            abi.encodeCall(h.requireInitConfig, (bytes.concat(expected, hex"00"), s, deploymentCommitment)),
            I.InvalidInitializationSelection.selector,
            "trailing InitConfig accepted"
        );
        reject(
            abi.encodeCall(h.requireInitConfig, (expected, s, bytes32(uint256(0x98)))),
            I.InvalidInitializationSelection.selector,
            "wrong deployment commitment accepted"
        );
        reject(
            abi.encodeCall(h.initConfig, (s, bytes32(0))),
            I.InvalidInitializationSelection.selector,
            "zero deployment commitment accepted"
        );
    }
}
