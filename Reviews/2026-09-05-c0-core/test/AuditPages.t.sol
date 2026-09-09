// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AdmissionLibrary} from "../src/AdmissionLibrary.sol";
import {PointReadLibrary} from "../src/PointReadLibrary.sol";
import {PreparationHelper} from "../src/PreparationHelper.sol";
import {QueryReadLibrary} from "../src/QueryReadLibrary.sol";
import {StateKernel} from "../src/StateKernel.sol";
import {StateReadPrimitives} from "../src/StateReadPrimitives.sol";
import {StorageByteView} from "../src/StorageByteView.sol";
import {IndexKeys} from "../src/IndexKeys.sol";
import {BindingReadHarness} from "./BindingReadHarness.sol";
import {AuditPageReadHarness, SyntheticAuditPageReadHarness} from "./AuditPageReadHarness.sol";
import {AuditPageCursor} from "../src/AuditPageCursor.sol";
import {StateAuditPages} from "../src/StateAuditPages.sol";

interface VmBindingReads {
    function readFile(string calldata) external view returns (string memory);
    function parseJsonString(string calldata, string calldata) external pure returns (string memory);
    function parseJsonBytes32(string calldata, string calldata) external pure returns (bytes32);
    function parseBytes(string calldata) external pure returns (bytes memory);
    function toString(uint256) external pure returns (string memory);
    function etch(address, bytes calldata) external;
    function snapshotState() external returns (uint256);
    function revertToState(uint256) external returns (bool);
    function record() external;
    function accesses(address) external returns (bytes32[] memory, bytes32[] memory);
}

contract StaticAuditConsumer {
    function read(address host, bytes calldata data) external view returns (bytes memory result) {
        (bool ok, bytes memory out) = host.staticcall(data);
        require(ok, "static page");
        return out;
    }
}

contract AuditPagesTest {
    function testHistoricalEmptyPrefixResumedOrderAndNoSemanticPrefetch() public {
        SyntheticAuditPageReadHarness h = deploySynthetic();
        bytes32 key = seed(h, 6);
        // The first five complete even if the next physical word is corrupt.
        h.seedAuditWordForTest(key, 1, uint256(6) | (uint256(1) << 240));
        StateAuditPages.PageResult memory page = h.pagePostings(0, 10, 0, 0, StateAuditPages.PageRequest(0, 5, 0));
        require(page.coverage == 5 && page.items.length == 5, "no next-item consumption");
        fail(address(h), rawData(page.cursor, 1, 6), abi.encodeWithSelector(StorageByteView.ErrReadState.selector, key));
        h.seedAuditWordForTest(key, 1, 6);
        h.seedAuditHeadForTest(key, uint256(3) | (uint256(3) << 64) | (uint256(6) << 128) | (uint256(1) << 176));
        h.seedAuditWordForTest(key, 0, uint256(2) | (uint256(4) << 48) | (uint256(6) << 96));
        page = h.pagePostings(0, 10, 0, 0, StateAuditPages.PageRequest(0, 1, 1));
        require(page.items.length == 0 && page.coverage == 0 && page.cursor == type(uint256).max, "no eligible prefix");
        page = h.pagePostings(0, 10, 0, 0, StateAuditPages.PageRequest(0, 1, 6));
        h.seedAuditWordForTest(key, 0, uint256(2) | (uint256(1) << 48) | (uint256(6) << 96));
        fail(address(h), rawData(page.cursor, 1, 6), abi.encodeWithSelector(StorageByteView.ErrReadState.selector, key));
    }

    function testQueryContextAndUnsupportedMetadataAreNotInterchangeable() public {
        SyntheticAuditPageReadHarness h = deploySynthetic();
        seed(h, 3);
        StateAuditPages.PageResult memory page = h.pagePostings(0, 10, 0, 0, StateAuditPages.PageRequest(0, 1, 0));
        bytes32 value = bytes32(uint256(42));
        bytes32 key = IndexKeys.posting(0, 10, 0, bytes32(uint256(42)));
        h.seedAuditHeadForTest(key, uint256(3) | (uint256(3) << 64) | (uint256(3) << 128) | (uint256(1) << 176));
        h.seedAuditWordForTest(key, 0, uint256(1) | (uint256(2) << 48) | (uint256(3) << 96));
        fail(
            address(h),
            abi.encodeCall(
                AuditPageReadHarness.pagePostings,
                (bytes32(0), 10, 0, value, StateAuditPages.PageRequest(page.cursor, 1, 3))
            ),
            abi.encodeWithSelector(AuditPageCursor.ErrPageCursor.selector, page.cursor)
        );
        h.seedAuditHeadForTest(IndexKeys.posting(0, 9, 0, 0), type(uint256).max);
        page = h.pagePostings(0, 9, 0, 0, StateAuditPages.PageRequest(type(uint256).max, 1, 3));
        require(uint8(page.completeness) == 3 && page.cursor == 0, "unsupported never reads metadata");
        uint64 sentinel = uint64((uint256(1) << 48) - 1);
        fail(
            address(h),
            rawData(0, 1, sentinel),
            abi.encodeWithSelector(StateReadPrimitives.ErrPageBasis.selector, sentinel, uint64(3))
        );
        fail(
            address(h),
            rawData(1, 1, sentinel),
            abi.encodeWithSelector(AuditPageCursor.ErrPageCursor.selector, uint256(1))
        );
        h.clearAuditRealmForTest();
        fail(address(h), rawData(1, 1, 0), abi.encodeWithSelector(StateKernel.InvalidInitialization.selector));
    }
    event ProbeEvidence(uint256 bisection, uint256 boundaryOnly, uint256 consumed, uint256 actualPostingSloads);

    function sparseWord(SyntheticAuditPageReadHarness h, bytes32 key, uint64 position, uint64 count) private {
        uint64 base = position / 5 * 5;
        uint256 packed;
        for (uint64 i; i < 5 && base + i < count; ++i) {
            packed |= uint256(base + i + 1) << (48 * i);
        }
        h.seedAuditWordForTest(key, position / 5, packed);
    }

    function testSparseU48NearMaximumCountsPostingSloadsIncludingRepeats() public {
        SyntheticAuditPageReadHarness h = deploySynthetic();
        uint64 count = uint64((uint256(1) << 48) - 2);
        uint64 H = 3;
        bytes32 key = IndexKeys.posting(0, 10, 0, 0);
        h.seedAuditCountForTest(count);
        h.seedAuditHeadForTest(
            key, uint256(count) | (uint256(count) << 64) | (uint256(count) << 128) | (uint256(1) << 176)
        );
        bytes32[] memory slots = new bytes32[](52);
        uint256 probes;
        uint64 lo;
        uint64 hi = count;
        while (lo < hi) {
            uint64 mid = lo + (hi - lo) / 2;
            sparseWord(h, key, mid, count);
            slots[probes++] = h.auditWordSlotForTest(key, mid / 5);
            if (mid + 1 <= H) lo = mid + 1;
            else hi = mid;
        }
        require(lo == 3 && probes <= 48, "u48 search bound");
        uint256 search = probes;
        // The selected end neighbors, resumed predecessor and one consumed posting.
        uint64[4] memory positions = [uint64(2), 3, 0, 1];
        for (uint256 i; i < 4; ++i) {
            sparseWord(h, key, positions[i], count);
            slots[probes++] = h.auditWordSlotForTest(key, positions[i] / 5);
        }
        uint256 tag = uint256(
            keccak256(
                abi.encode(
                    keccak256("efs2/pk/1"),
                    REALM,
                    REVISION,
                    uint256(1),
                    uint256(1),
                    bytes32(0),
                    uint256(10),
                    uint256(0),
                    bytes32(0)
                )
            )
        ) & ((uint256(1) << 103) - 1);
        uint256 token = uint256(1) | (uint256(3) << 48) | (uint256(H) << 96) | (uint256(1) << 144) | (tag << 152);
        vm.record();
        StateAuditPages.PageResult memory page = h.pagePostings(0, 10, 0, 0, StateAuditPages.PageRequest(token, 1, H));
        (bytes32[] memory reads,) = vm.accesses(address(h));
        uint256 actual;
        for (uint256 i; i < reads.length; ++i) {
            for (uint256 j; j < probes; ++j) {
                if (reads[i] == slots[j]) {
                    ++actual;
                    break;
                }
            }
        }
        require(page.coverage == 1 && page.items[0] == bytes32(uint256(2)), "one consumed posting");
        require(actual == probes && search + 3 <= 51, "separate boundary-only bound");
        emit ProbeEvidence(search, search + 3, page.coverage, actual);
    }

    function deploySynthetic() private returns (SyntheticAuditPageReadHarness h) {
        (StateKernel.Init memory init,) = initValue();
        PreparationHelper helper = new PreparationHelper();
        h = new SyntheticAuditPageReadHarness(
            init,
            address(helper),
            address(helper).codehash,
            address(AdmissionLibrary).codehash,
            address(PointReadLibrary).codehash,
            address(QueryReadLibrary).codehash
        );
    }

    function seed(SyntheticAuditPageReadHarness h, uint64 n) private returns (bytes32 key) {
        key = IndexKeys.posting(0, 10, 0, 0);
        h.seedAuditCountForTest(n);
        h.seedAuditHeadForTest(
            key, n == 0 ? 0 : uint256(n) | (uint256(n) << 64) | (uint256(n) << 128) | (uint256(1) << 176)
        );
        for (uint64 base; base < n; base += 5) {
            uint256 packed;
            for (uint64 j; j < 5 && base + j < n; ++j) {
                packed |= uint256(base + j + 1) << (48 * j);
            }
            h.seedAuditWordForTest(key, base / 5, packed);
        }
    }

    function rawData(uint256 token, uint16 limit, uint64 H) private pure returns (bytes memory) {
        return abi.encodeCall(
            AuditPageReadHarness.pagePostings,
            (bytes32(0), 10, 0, bytes32(0), StateAuditPages.PageRequest(token, limit, H))
        );
    }

    function fail(address h, bytes memory data, bytes memory expected) private view {
        (bool ok, bytes memory actual) = h.staticcall(data);
        require(!ok && keccak256(actual) == keccak256(expected), "exact refusal");
    }

    function testDenseRawLimitsAndPinnedPrefix() public {
        SyntheticAuditPageReadHarness h = deploySynthetic();
        seed(h, 513);
        uint16[8] memory limits = [uint16(0), 1, 2, 511, 512, 513, 65535, 3];
        for (uint256 i; i < limits.length; ++i) {
            uint256 expected = limits[i] == 0 ? 1 : limits[i] > 512 ? 512 : limits[i];
            StateAuditPages.PageResult memory p =
                h.pagePostings(0, 10, 0, 0, StateAuditPages.PageRequest(0, limits[i], 0));
            require(p.items.length == expected && p.coverage == expected && uint8(p.completeness) == 2, "raw clamp");
            require(p.items[0] == bytes32(uint256(1)) && p.items[expected - 1] == bytes32(expected), "dense items");
            require(abi.encode(p).length == 256 + 32 * expected, "raw ABI bytes");
            StateAuditPages.PageResult memory tail =
                h.pagePostings(0, 10, 0, 0, StateAuditPages.PageRequest(p.cursor, 65535, 513));
            require(
                tail.items.length == 513 - expected && tail.cursor == type(uint256).max
                    && uint8(tail.completeness) == 1,
                "exact suffix"
            );
        }
        for (uint64 H = 1; H < 10; ++H) {
            StateAuditPages.PageResult memory p = h.pagePostings(0, 10, 0, 0, StateAuditPages.PageRequest(0, 65535, H));
            require(p.items.length == H && p.coverage == H && p.cursor == type(uint256).max, "historical prefix");
        }
    }

    function testEmptyZeroOpaqueAndQualifiedUnsupported() public {
        SyntheticAuditPageReadHarness h = deploySynthetic();
        StateAuditPages.PageResult memory p = h.pagePostings(0, 10, 0, 0, StateAuditPages.PageRequest(0, 0, 0));
        require(
            p.realmBasis == REVISION && p.highWaterOrdinal == 0 && p.cursor == type(uint256).max
                && uint8(p.completeness) == 1 && p.items.length == 0,
            "empty initialized"
        );
        StateAuditPages.HydratedItem[] memory rows;
        (p, rows) = h.pagePostingsHydrated(0, 8, 0, 0, StateAuditPages.PageRequest(0, 65535, 0));
        require(rows.length == 0 && abi.encode(p, rows).length == 320, "empty hydrated bytes");
        seed(h, 2);
        for (uint8 kind; kind < 12; ++kind) {
            if (kind == 8 || kind == 10) continue;
            p = h.pagePostings(0, kind, 0, 0, StateAuditPages.PageRequest(type(uint256).max, 1, 1));
            require(
                p.realmBasis == REVISION && p.highWaterOrdinal == 1 && p.cursor == 0 && p.coverage == 0
                    && uint8(p.completeness) == 3 && p.items.length == 0,
                "unsupported ignores token"
            );
            fail(
                address(h),
                abi.encodeWithSignature("counts(bytes32,uint8,uint8,bytes32)", bytes32(0), kind, uint8(0), bytes32(0)),
                abi.encodeWithSelector(
                    StateAuditPages.ErrIndexQueryUnsupported.selector, bytes32(0), kind, uint8(0), bytes32(0)
                )
            );
        }
        p = h.pagePostings(bytes32(uint256(1)), 10, 0, 0, StateAuditPages.PageRequest(0, 1, 0));
        require(uint8(p.completeness) == 3, "malformed type");
        p = h.pagePostings(0, 10, 1, 0, StateAuditPages.PageRequest(0, 1, 0));
        require(uint8(p.completeness) == 3, "malformed ordinal");
    }

    function testExactCursorCorruptionAndRefusalPrecedence() public {
        SyntheticAuditPageReadHarness h = deploySynthetic();
        bytes32 key = seed(h, 3);
        StateAuditPages.PageResult memory p = h.pagePostings(0, 10, 0, 0, StateAuditPages.PageRequest(0, 1, 0));
        uint256[8] memory tokens = [
            p.cursor ^ (uint256(1) << 144),
            p.cursor | (uint256(1) << 255),
            p.cursor ^ (uint256(1) << 152),
            p.cursor ^ (uint256(1) << 48),
            p.cursor ^ (uint256(1) << 96),
            p.cursor - 1,
            p.cursor + 2,
            type(uint256).max
        ];
        for (uint256 i; i < tokens.length; ++i) {
            fail(
                address(h),
                rawData(tokens[i], 1, 3),
                abi.encodeWithSelector(AuditPageCursor.ErrPageCursor.selector, tokens[i])
            );
        }
        fail(
            address(h),
            rawData(p.cursor, 1, 0),
            abi.encodeWithSelector(AuditPageCursor.ErrPageCursor.selector, p.cursor)
        );
        fail(
            address(h),
            rawData(p.cursor, 1, 4),
            abi.encodeWithSelector(AuditPageCursor.ErrPageCursor.selector, p.cursor)
        );
        fail(
            address(h),
            rawData(0, 1, 4),
            abi.encodeWithSelector(StateReadPrimitives.ErrPageBasis.selector, uint64(4), uint64(3))
        );
        fail(
            address(h),
            abi.encodeCall(
                AuditPageReadHarness.pagePostingsHydrated,
                (bytes32(0), 10, 0, bytes32(0), StateAuditPages.PageRequest(p.cursor, 1, 3))
            ),
            abi.encodeWithSelector(AuditPageCursor.ErrPageCursor.selector, p.cursor)
        );
        fail(
            address(h),
            abi.encodeCall(
                AuditPageReadHarness.pagePostings,
                (bytes32(0), 9, 0, bytes32(0), StateAuditPages.PageRequest(p.cursor, 1, 0))
            ),
            abi.encodeWithSelector(AuditPageCursor.ErrPageCursor.selector, p.cursor)
        );
        h.seedAuditCountForTest(uint64((uint256(1) << 48) - 1));
        fail(address(h), rawData(p.cursor, 1, 0), abi.encodeWithSelector(StorageByteView.ErrReadState.selector, key));
    }

    function testCorruptHeadWordsAndHydrationRefuse() public {
        SyntheticAuditPageReadHarness h = deploySynthetic();
        bytes32 key = seed(h, 3);
        uint256 valid = uint256(3) | (uint256(3) << 64) | (uint256(3) << 128) | (uint256(1) << 176);
        uint256[7] memory heads = [
            valid ^ (uint256(1) << 176),
            valid | (uint256(1) << 192),
            valid - (uint256(1) << 64),
            valid + 1,
            valid + (uint256(1) << 128),
            uint256(1),
            valid | (uint256(1) << 177)
        ];
        for (uint256 i; i < heads.length; ++i) {
            h.seedAuditHeadForTest(key, heads[i]);
            fail(address(h), rawData(0, 1, 0), abi.encodeWithSelector(StorageByteView.ErrReadState.selector, key));
        }
        h.seedAuditHeadForTest(key, valid);
        uint256 packed = uint256(1) | (uint256(2) << 48) | (uint256(3) << 96);
        uint256[7] memory words = [
            packed | (uint256(1) << 240),
            packed | (uint256(1) << 144),
            packed - 1,
            packed | ((uint256(1) << 48) - 1),
            uint256(4) | (uint256(2) << 48) | (uint256(3) << 96),
            uint256(2) | (uint256(1) << 48) | (uint256(3) << 96),
            uint256(1) | (uint256(2) << 48) | (uint256(2) << 96)
        ];
        for (uint256 i; i < words.length; ++i) {
            h.seedAuditWordForTest(key, 0, words[i]);
            fail(address(h), rawData(0, 3, 0), abi.encodeWithSelector(StorageByteView.ErrReadState.selector, key));
        }
        h.seedAuditWordForTest(key, 0, packed);
        fail(
            address(h),
            abi.encodeCall(
                AuditPageReadHarness.pagePostingsHydrated,
                (bytes32(0), 10, 0, bytes32(0), StateAuditPages.PageRequest(0, 1, 0))
            ),
            abi.encodeWithSelector(StorageByteView.ErrReadState.selector, key)
        );
        h.clearAuditRevisionForTest();
        fail(address(h), rawData(0, 1, 0), abi.encodeWithSelector(StorageByteView.ErrReadState.selector, key));
    }

    function testOrdinaryCallsWriteNothingAndGuardBeforeArguments() public {
        SyntheticAuditPageReadHarness h = deploySynthetic();
        seed(h, 3);
        bytes[] memory calls = new bytes[](3);
        calls[0] = rawData(0, 2, 0);
        calls[1] = abi.encodeCall(
            AuditPageReadHarness.pagePostingsHydrated,
            (bytes32(0), 8, 0, bytes32(0), StateAuditPages.PageRequest(0, 1, 0))
        );
        calls[2] =
            abi.encodeWithSignature("counts(bytes32,uint8,uint8,bytes32)", bytes32(0), uint8(10), uint8(0), bytes32(0));
        for (uint256 i; i < calls.length; ++i) {
            vm.record();
            (bool ok, bytes memory result) = address(h).call(calls[i]);
            require(ok, "ordinary call");
            (, bytes32[] memory hostWrites) = vm.accesses(address(h));
            (, bytes32[] memory libraryWrites) = vm.accesses(address(QueryReadLibrary));
            require(hostWrites.length == 0 && libraryWrites.length == 0, "no retained writes");
            StaticAuditConsumer consumer = new StaticAuditConsumer();
            require(keccak256(consumer.read(address(h), calls[i])) == keccak256(result), "static identical bytes");
        }
        vm.etch(address(QueryReadLibrary), hex"60006000fd");
        for (uint256 i; i < calls.length; ++i) {
            fail(address(h), calls[i], abi.encodeWithSelector(BindingReadHarness.ReadCodeMismatch.selector, uint8(2)));
        }
        fail(
            address(h),
            rawData(type(uint256).max, 0, 0),
            abi.encodeWithSelector(BindingReadHarness.ReadCodeMismatch.selector, uint8(2))
        );
    }
    bytes32 private constant AUTHOR = bytes32(type(uint256).max);
    bytes32 private constant REALM = keccak256("binding-read-realm");
    bytes32 private constant REVISION = keccak256("binding-read-revision");
    VmBindingReads private constant vm = VmBindingReads(address(uint160(uint256(keccak256("hevm cheat code")))));

    function candidateJson() private view returns (string memory) {
        return vm.readFile("../2026-09-05-mvp-build-start/type-inputs/artifacts.v1.json");
    }

    function candidateGroup(uint256 index) private view returns (bytes memory) {
        return vm.parseBytes(
            string.concat(
                "0x", vm.parseJsonString(candidateJson(), string.concat(".groups[", vm.toString(index), "].groupHex"))
            )
        );
    }

    function candidateType(uint256 groupIndex, uint256 memberIndex) private view returns (bytes32) {
        return vm.parseJsonBytes32(
            candidateJson(),
            string.concat(
                ".groups[", vm.toString(groupIndex), "].members[", vm.toString(memberIndex), "].temporaryTypeSchemaId"
            )
        );
    }

    function intrinsicBlob() private pure returns (bytes memory blob) {
        blob = abi.encodePacked(
            hex"0001001154797065536368656d6147726f75702f31000000",
            bytes32(0),
            hex"0001000a67726f75704279746573051ffe0000000000000000"
        );
    }

    function initValue() private view returns (StateKernel.Init memory init, bytes32 metaId) {
        bytes memory blob = intrinsicBlob();
        bytes memory intrinsic = abi.encodePacked(uint16(1), uint16(blob.length), blob);
        metaId = keccak256(
            abi.encode(
                keccak256("efs2/typeschema/1"),
                keccak256(abi.encode(keccak256("efs2/typeschema-group/1"), keccak256(intrinsic))),
                uint256(0)
            )
        );
        init = StateKernel.Init(REALM, REVISION, intrinsic, candidateGroup(0), candidateGroup(1));
    }

    function deployHost() private returns (AuditPageReadHarness h, bytes32 metaId) {
        StateKernel.Init memory init;
        (init, metaId) = initValue();
        PreparationHelper helper = new PreparationHelper();
        h = new AuditPageReadHarness(
            init,
            address(helper),
            address(helper).codehash,
            address(AdmissionLibrary).codehash,
            address(PointReadLibrary).codehash,
            address(QueryReadLibrary).codehash
        );
    }

    function identify(StateKernel.Publication memory p) private pure {
        bytes32 domain = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version)"), keccak256("EFS2-Envelope"), keccak256("1")
            )
        );
        bytes32 statement = keccak256(
            abi.encode(
                keccak256(
                    "PublicationEnvelope(uint16 profile,bytes32 principalId,bytes32 authorityRef,uint64 authEpoch,bytes32 pubNonce,uint64 notAfter,bytes32[] recordIds)"
                ),
                p.header,
                keccak256(abi.encodePacked(p.recordIds))
            )
        );
        p.envelopeId = keccak256(
            abi.encode(keccak256("efs2/envelope/1"), keccak256(abi.encodePacked(hex"1901", domain, statement)))
        );
    }

    function publication(StateKernel.SelectedLeaf[] memory leaves, uint256 nonce)
        private
        pure
        returns (StateKernel.Publication memory p)
    {
        p.header = StateKernel.EnvelopeHeader(1, AUTHOR, 0, 0, bytes32(nonce), 0);
        p.recordIds = new bytes32[](leaves.length);
        p.leafMask = uint64((uint256(1) << leaves.length) - 1);
        p.leaves = leaves;
        for (uint256 i; i < leaves.length; ++i) {
            p.recordIds[i] =
                keccak256(abi.encode(keccak256("efs2/record/1"), leaves[i].typeId, keccak256(leaves[i].body)));
        }
        identify(p);
    }

    function publicationAs(StateKernel.SelectedLeaf[] memory leaves, uint256 nonce, bytes32 principal)
        private
        pure
        returns (StateKernel.Publication memory p)
    {
        p = publication(leaves, nonce);
        p.header.principalId = principal;
        identify(p);
    }

    function publish(BindingReadHarness h, StateKernel.Publication memory p)
        private
        returns (StateKernel.AdmitResult memory)
    {
        return h.publishTrustedForTest(StateKernel.VerifiedContext(AUTHOR, 1, 0x1234, bytes32(uint256(0xabcd))), p);
    }

    function installGroup(BindingReadHarness h, bytes32 metaId, uint256 groupIndex, uint256 nonce) private {
        StateKernel.SelectedLeaf[] memory leaves = new StateKernel.SelectedLeaf[](1);
        bytes memory group = candidateGroup(groupIndex);
        leaves[0] = StateKernel.SelectedLeaf(0, metaId, abi.encodePacked(uint16(group.length), group));
        publish(h, publication(leaves, nonce));
    }

    function one(bytes32 typeId, bytes memory body, uint256 nonce, bytes32 principal)
        private
        pure
        returns (StateKernel.Publication memory p)
    {
        StateKernel.SelectedLeaf[] memory leaves = new StateKernel.SelectedLeaf[](1);
        leaves[0] = StateKernel.SelectedLeaf(0, typeId, body);
        p = publicationAs(leaves, nonce, principal);
    }

    function testActualFirstScopeAnchor() public {
        (AuditPageReadHarness h, bytes32 metaId) = deployHost();
        installGroup(h, metaId, 0, 1);
        installGroup(h, metaId, 1, 2);
        StateKernel.Publication memory object =
            one(candidateType(0, 0), abi.encodePacked(AUTHOR, bytes32(uint256(99)), hex"00"), 3, AUTHOR);
        publish(h, object);
        bytes32 subject = object.recordIds[0];
        StateKernel.Publication memory tombstone = one(
            candidateType(1, 1), abi.encodePacked(bytes32(uint256(1)), subject, bytes32(uint256(2)), hex"00"), 4, AUTHOR
        );
        tombstone.expectedRevisions = new StateKernel.ExpectedRevision[](1);
        tombstone.expectedRevisions[0] = StateKernel.ExpectedRevision(0, 0);
        uint64 anchor = publish(h, tombstone).leaves[0].admissionOrdinal;
        bytes32 scope = IndexKeys.scope(AUTHOR, bytes32(uint256(1)), subject);
        StateAuditPages.PageResult memory page = h.pagePostings(0, 10, 0, scope, StateAuditPages.PageRequest(0, 1, 0));
        require(page.items.length == 1 && page.items[0] == bytes32(uint256(anchor)), "first Scope anchor");
        require(page.realmBasis == REVISION && page.highWaterOrdinal == 4, "page basis");
        require(
            page.coverage == 1 && uint8(page.completeness) == 1 && page.cursor == type(uint256).max, "complete page"
        );
        StateKernel.Publication memory withdrawal =
            one(candidateType(1, 2), abi.encodePacked(tombstone.envelopeId, uint16(0)), 5, AUTHOR);
        publish(h, withdrawal);
        StateAuditPages.HydratedItem[] memory rows;
        (page, rows) = h.pagePostingsHydrated(0, 10, 0, scope, StateAuditPages.PageRequest(0, 1, 4));
        require(
            rows[0].occurrenceStatus == 1 && rows[0].revokedAtOrdinal == 0 && rows[0].principalId == AUTHOR,
            "historical lifecycle"
        );
        (page, rows) = h.pagePostingsHydrated(0, 10, 0, scope, StateAuditPages.PageRequest(0, 1, 0));
        require(
            rows[0].occurrenceStatus == 2 && rows[0].revokedAtOrdinal == 5 && page.coverage == 1,
            "current audit retains withdrawn"
        );
        bytes memory data = abi.encodeCall(
            AuditPageReadHarness.pagePostingsHydrated, (bytes32(0), 10, 0, scope, StateAuditPages.PageRequest(0, 1, 4))
        );
        vm.record();
        (bool ok, bytes memory returned) = address(h).call(data);
        require(ok, "ordinary historical hydration");
        (, bytes32[] memory writes) = vm.accesses(address(h));
        require(writes.length == 0, "historical hydration no writes");
        StaticAuditConsumer consumer = new StaticAuditConsumer();
        require(keccak256(returned) == keccak256(consumer.read(address(h), data)), "historical static bytes");
    }
}
