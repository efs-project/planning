// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {C0RunCodec as C} from "../src/C0RunCodec.sol";
import {CodecHarness} from "./CodecHarness.sol";

contract RunCodecTest {
    CodecHarness private h = new CodecHarness();

    // Entirely synthetic: not valid genesis or a selection of measured caps.
    function sample() internal pure returns (C.SeedInputs memory s) {
        s.namespace = "efs2/mvp-c0/2026-09-03";
        s.runId = bytes32(uint256(1));
        s.sourceCommitments = new C.Commitment[](2);
        s.sourceCommitments[0] = C.Commitment("a", bytes32(uint256(2)));
        s.sourceCommitments[1] = C.Commitment("b", bytes32(uint256(3)));
        s.toolchainCommitments = new C.Commitment[](1);
        s.toolchainCommitments[0] = C.Commitment("node", bytes32(uint256(4)));
        s.chainConfigCommitment = bytes32(uint256(5));
        s.deploymentFactoryAddress = address(6);
        s.coreCreationCodeTemplateHash = bytes32(uint256(7));
        s.byteStoreCreationCodeTemplateHash = bytes32(uint256(8));
        s.codexConstantsHash = bytes32(uint256(9));
        s.indexCapabilityRoot = bytes32(uint256(10));
        s.orderedTypeGroupRoot = bytes32(uint256(11));
        s.schemaAuthorAddress = address(12);
        s.bootstrapAuthorAddress = address(13);
        s.byteMeasurementReportHash = bytes32(uint256(14));
        s.maxStateFileBytes = 8192;
        s.maxReadRangeBytes = 4096;
        s.stateGrowthMargin = 1;
        s.destructionPolicyHash = bytes32(uint256(15));
    }

    function deployed() internal pure returns (C.Deployment memory) {
        return C.Deployment(
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
    }

    function seedBytes() internal pure returns (bytes memory) {
        return bytes.concat(
            hex"0016656673322f6d76702d63302f323032362d30392d3033",
            bytes32(uint256(1)),
            hex"000200000023000161",
            bytes32(uint256(2)),
            hex"00000023000162",
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
            bytes32(uint256(15))
        );
    }

    function deployedBytes() internal pure returns (bytes memory) {
        return bytes.concat(
            bytes32(uint256(1)),
            bytes20(address(2)),
            bytes32(0),
            bytes32(uint256(3)),
            bytes32(uint256(4)),
            bytes20(address(5)),
            bytes32(0),
            bytes32(uint256(6)),
            bytes32(uint256(7))
        );
    }

    function rejectsSeed(bytes memory b) internal view {
        (bool ok,) = address(h).staticcall(abi.encodeCall(h.decodeSeed, (b)));
        require(!ok, "seed accepted malformed bytes");
    }

    function rejectsDeployment(bytes memory b) internal view {
        (bool ok,) = address(h).staticcall(abi.encodeCall(h.decodeDeployment, (b)));
        require(!ok, "deployment accepted malformed bytes");
    }

    function testSeedMatchesHandPackedBytes() public view {
        require(keccak256(h.encodeSeed(sample())) == keccak256(seedBytes()), "wrong seed bytes");
        require(
            keccak256(abi.encode(h.decodeSeed(seedBytes()))) == keccak256(abi.encode(sample())), "wrong seed decode"
        );
    }

    function testDeploymentMatchesHandPackedBytes() public view {
        require(h.encodeDeployment(deployed()).length == 264, "wrong deployment width");
        require(keccak256(h.encodeDeployment(deployed())) == keccak256(deployedBytes()), "wrong deployment bytes");
        require(
            keccak256(abi.encode(h.decodeDeployment(deployedBytes()))) == keccak256(abi.encode(deployed())),
            "wrong deployment decode"
        );
    }

    function testRejectAllTruncationsAndTrailing() public view {
        bytes memory a = seedBytes();
        bytes memory b = deployedBytes();
        for (uint256 i; i < a.length; ++i) {
            bytes memory p = new bytes(i);
            for (uint256 j; j < i; ++j) {
                p[j] = a[j];
            }
            rejectsSeed(p);
        }
        for (uint256 i; i < b.length; ++i) {
            bytes memory p = new bytes(i);
            for (uint256 j; j < i; ++j) {
                p[j] = b[j];
            }
            rejectsDeployment(p);
        }
        rejectsSeed(bytes.concat(a, hex"00"));
        rejectsDeployment(bytes.concat(b, hex"00"));
    }

    function testStrictNamespaceAndCommitmentFrames() public view {
        bytes memory b = seedBytes();
        b[2] = 0x66;
        rejectsSeed(b);
        b = seedBytes();
        b[57] = 0;
        rejectsSeed(b);
        b = seedBytes();
        b[57] = 0x41;
        rejectsSeed(b);
        b = seedBytes();
        b[61] = 0x22;
        rejectsSeed(b);
        b = seedBytes();
        b[61] = 0x24;
        rejectsSeed(b);
        b = seedBytes();
        b[64] = 0x20;
        rejectsSeed(b);
        b = seedBytes();
        b[103] = 0x61;
        rejectsSeed(b);
        b = seedBytes();
        b[64] = 0x62;
        b[103] = 0x61;
        rejectsSeed(b);
        b = seedBytes();
        b[96] = 0;
        rejectsSeed(b);
    }

    function testZeroRequiredFieldsAndEqualAddressesReject() public view {
        uint256[17] memory seedOffsets =
            [uint256(24), 65, 104, 148, 180, 212, 296, 328, 360, 392, 424, 456, 476, 496, 528, 536, 560];
        uint256[17] memory widths = [uint256(32), 32, 32, 32, 32, 20, 32, 32, 32, 32, 32, 20, 20, 32, 8, 8, 32];
        for (uint256 i; i < seedOffsets.length; ++i) {
            bytes memory b = seedBytes();
            for (uint256 j; j < widths[i]; ++j) {
                b[seedOffsets[i] + j] = 0;
            }
            rejectsSeed(b);
        }
        C.SeedInputs memory s = sample();
        s.bootstrapAuthorAddress = s.schemaAuthorAddress;
        (bool ok,) = address(h).staticcall(abi.encodeCall(h.encodeSeed, (s)));
        require(!ok, "equal authors");
        C.Deployment memory d = deployed();
        d.byteStoreAddress = d.coreAddress;
        (ok,) = address(h).staticcall(abi.encodeCall(h.encodeDeployment, (d)));
        require(!ok, "equal addresses");
        uint256[7] memory offsets = [uint256(0), 32, 84, 116, 148, 200, 232];
        for (uint256 i; i < offsets.length; ++i) {
            bytes memory b = deployedBytes();
            uint256 width = i == 1 || i == 4 ? 20 : 32;
            for (uint256 j; j < width; ++j) {
                b[offsets[i] + j] = 0;
            }
            rejectsDeployment(b);
        }
    }

    function testMaxU64AndRangeCap() public view {
        C.SeedInputs memory s = sample();
        s.maxStateFileBytes = type(uint64).max;
        s.maxReadRangeBytes = type(uint64).max;
        s.transactionGasMargin = type(uint64).max;
        s.stateGrowthMargin = type(uint64).max;
        C.SeedInputs memory actual = h.decodeSeed(h.encodeSeed(s));
        require(
            actual.transactionGasMargin == type(uint64).max && actual.maxStateFileBytes == type(uint64).max
                && actual.maxReadRangeBytes == type(uint64).max && actual.stateGrowthMargin == type(uint64).max,
            "u64 loss"
        );
        s = sample();
        s.maxReadRangeBytes = 8193;
        (bool ok,) = address(h).staticcall(abi.encodeCall(h.encodeSeed, (s)));
        require(!ok, "range exceeds cap");
    }

    function testOriginalDomainFormulas() public view {
        bytes32 sh = keccak256(seedBytes());
        bytes32 dh = keccak256(deployedBytes());
        require(h.seedInputsHash(sample()) == sh, "seed hash");
        require(h.deploymentHash(deployed()) == dh, "deployment hash");
        require(
            h.experimentSeed(sample()) == keccak256(abi.encode(keccak256("efs2/mvp-c0/experiment-seed/1"), sh)),
            "seed domain"
        );
        bytes32 c = keccak256(abi.encode(keccak256("efs2/mvp-c0/experiment-deployment/1"), bytes32(uint256(1)), dh));
        require(h.experimentCommitment(deployed()) == c, "deployment domain");
        require(h.c0ProfileId(c) == keccak256(abi.encode(keccak256("efs2/mvp-c0/profile/1"), c)), "profile domain");
    }

    function testEveryDeploymentFieldAndManifestAffectCommitments() public view {
        bytes memory b = deployedBytes();
        bytes32 original = h.experimentCommitment(deployed());
        uint256[9] memory ends = [uint256(31), 51, 83, 115, 147, 167, 199, 231, 263];
        for (uint256 i; i < ends.length; ++i) {
            bytes memory mutated = deployedBytes();
            mutated[ends[i]] = 0x2a;
            require(h.experimentCommitment(h.decodeDeployment(mutated)) != original, "deployment field unbound");
        }
        C.SeedInputs memory s = sample();
        bytes32 es = h.experimentSeed(s);
        s.sourceCommitments[0].digest = bytes32(uint256(42));
        require(h.experimentSeed(s) != es, "source unbound");
        s = sample();
        s.toolchainCommitments[0].digest = bytes32(uint256(42));
        require(h.experimentSeed(s) != es, "toolchain unbound");
        require(b.length == 264, "fixture");
    }

    function testEncoderCommitmentValidationAndMaximumBoundaries() public view {
        C.SeedInputs memory s = sample();
        s.sourceCommitments = new C.Commitment[](64);
        for (uint256 i; i < 64; ++i) {
            bytes memory label = new bytes(64);
            for (uint256 j; j < 64; ++j) {
                label[j] = 0x61;
            }
            label[0] = bytes1(uint8(48 + i / 10));
            label[1] = bytes1(uint8(48 + i % 10));
            s.sourceCommitments[i] = C.Commitment(string(label), bytes32(i + 1));
        }
        require(h.decodeSeed(h.encodeSeed(s)).sourceCommitments.length == 64, "max count/label");
        for (uint256 i; i < 7; ++i) {
            s = sample();
            if (i == 0) s.sourceCommitments = new C.Commitment[](0);
            if (i == 1) s.sourceCommitments = new C.Commitment[](65);
            if (i == 2) s.sourceCommitments[0].label = "";
            if (i == 3) s.sourceCommitments[0].label = string(new bytes(65));
            if (i == 4) s.sourceCommitments[0].label = unicode"é";
            if (i == 5) s.sourceCommitments[0].label = "b";
            if (i == 6) s.namespace = "efs2/mvp-c0/2026-09-04";
            (bool ok,) = address(h).staticcall(abi.encodeCall(h.encodeSeed, (s)));
            require(!ok, "invalid source accepted");
        }
        (bool profileOk,) = address(h).staticcall(abi.encodeCall(h.c0ProfileId, (bytes32(0))));
        require(!profileOk, "zero commitment");
    }

    function testExternalAbiRejectsU64OverflowBeforeCodec() public view {
        bytes memory callData = abi.encodeCall(h.encodeSeed, (sample()));
        // Selector(4), argument offset(32), then maxStateFileBytes is tuple word 16.
        callData[4 + 32 + 16 * 32] = 0x01;
        (bool ok,) = address(h).staticcall(callData);
        require(!ok, "ABI u64 overflow accepted");
    }
}
