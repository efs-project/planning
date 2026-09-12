// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {NativeKernel} from "../src/NativeKernel.sol";
import {ExactTypeRegistry, Uint256Validator} from "../src/ExactTypeRegistry.sol";
import {TestBase} from "./TestBase.sol";
import {CanonicalFixtures} from "./fixtures/CanonicalFixtures.sol";
import {DiscoveryIndex} from "../src/DiscoveryIndex.sol";
import {CanonicalPayloadConsumer} from "../src/CanonicalPayloadConsumer.sol";
import {NativeRecordKernel} from "../src/NativeRecordKernel.sol";
import {RecordInventoryIndex} from "../src/RecordInventoryIndex.sol";
import {RecordProducer, GenericRecords} from "./fixtures/RecordProducer.sol";
import {QuoteProducer, QuoteReader} from "../src/Examples.sol";

interface VmFiles {
    function getNonce(address) external view returns (uint64);
    function load(address, bytes32) external view returns (bytes32);
    function store(address, bytes32, bytes32) external;
}

interface CanonicalRegistryFilesApi {
    function registerGroup(bytes calldata) external returns (bytes32, bytes32[] memory);
}

contract CanonicalFilesTest is TestBase {
    VmFiles private constant state = VmFiles(address(vm));

    function candidate() private returns (NativeKernel k, bytes32[] memory ids) {
        bytes memory code = vm.getCode("test/fixtures/canonical-preparation-helper.json");
        address helper;
        assembly { helper := create(0, add(code, 32), mload(code)) }
        code = bytes.concat(vm.getCode("NativeKernel.sol:NativeKernel"), abi.encode(helper));
        address deployed;
        assembly { deployed := create(0, add(code, 32), mload(code)) }
        require(deployed != address(0), "candidate deployed");
        k = NativeKernel(deployed);
        (, ids) = k.types().registerGroup(CanonicalFixtures.group_defaults());
    }

    function testCanonicalDirectFacadeContractProducerAndTwoNamespacesShareOneRecord() public {
        (NativeKernel k, bytes32[] memory ids) = candidate();
        NativeRecordKernel records = k.recordKernel();
        bytes memory b = abi.encode(uint256(3000));
        bytes32 expected = keccak256(abi.encode(keccak256("efs2/record/1"), ids[0], keccak256(b)));
        eq(records.storeRecord(ids[0], b), expected);
        eq(k.storeRecord(ids[0], b), expected);
        RecordProducer producer = new RecordProducer();
        eq(producer.publish(GenericRecords(address(records)), ids[0], b), expected);
        eq(k.fileNonce(address(producer)), 0);
        bytes32 root = k.ensureRoot();
        bytes32 a = k.createFile(root, "a", ids[0], b);
        vm.prank(address(0xbeef));
        bytes32 otherRoot = k.ensureRoot();
        vm.prank(address(0xbeef));
        bytes32 other = k.createFile(otherRoot, "same", ids[0], b);
        require(other != a && otherRoot != root, "File identity remains owner scoped");
        eq(k.fileInfo(a).recordId, expected);
        eq(k.fileInfo(other).recordId, expected);
        eq(k.recordInventory().typeInventory(ids[0], RecordInventoryIndex.Cursor(0, 0, 0), 64).ids.length, 1);
        eq(k.readRecord(expected).body, b);
    }

    function testCanonicalLifecycleSameContentCASOwnerNameMoveUnlinkAndEveryRevision() public {
        (NativeKernel k, bytes32[] memory ids) = candidate();
        bytes32 root = k.ensureRoot();
        bytes32 folder = k.createDirectory(root, "folder");
        bytes32 f = k.createFile(root, "file", ids[1], hex"0000");
        bytes32 empty = k.fileInfo(f).recordId;
        k.editFile(f, 1, ids[1], hex"0000");
        eq(k.fileInfo(f).recordId, empty);
        k.editFile(f, 2, ids[1], hex"0003010000");
        bytes32 changed = k.fileInfo(f).recordId;
        require(changed != empty, "new body identity");
        uint64 helperNonce = state.getNonce(k.types().helper());
        uint64 writerNonce = state.getNonce(address(k.recordKernel().bodyWriter()));
        vm.expectRevert(NativeKernel.StaleRevision.selector);
        k.editFile(f, 1, ids[1], hex"000101");
        vm.prank(address(0xbeef));
        vm.expectRevert(NativeKernel.Unauthorized.selector);
        k.editFile(f, 3, ids[1], hex"000101");
        vm.expectRevert();
        k.createFile(root, "file", ids[1], hex"000101");
        eq(state.getNonce(k.types().helper()), helperNonce);
        eq(state.getNonce(address(k.recordKernel().bodyWriter())), writerNonce);
        eq(k.fileNonce(address(this)), 2);
        k.moveFile(f, 3, folder, "renamed");
        k.unlink(f, 4);
        for (uint64 revision = 1; revision <= 5; ++revision) {
            NativeKernel.Revision memory r = k.revisionAt(f, revision);
            eq(r.recordId, revision <= 2 ? empty : changed);
            eq(r.parent, revision <= 3 ? root : folder);
            eq(r.name, revision <= 3 ? bytes("file") : bytes("renamed"));
            require(r.live == (revision < 5), "retained live history");
        }
        eq(k.readRecord(empty).body, hex"0000");
        eq(k.readRecord(changed).body, hex"0003010000");
        eq(k.recordInventory().typeInventory(ids[1], RecordInventoryIndex.Cursor(0, 0, 0), 64).ids.length, 2);
    }

    function testCanonicalWordsAndCodeKeepNativeMetadataRootsAnd4096Bound() public {
        (NativeKernel k, bytes32[] memory ids) = candidate();
        NativeRecordKernel records = k.recordKernel();
        bytes32 small = records.storeRecord(ids[0], abi.encode(uint256(3000)));
        bytes32 slot = keccak256(abi.encode(small, uint256(0)));
        eq(state.load(address(records), slot), ids[0]);
        uint256 metadata = uint256(state.load(address(records), bytes32(uint256(slot) + 1)));
        eq((metadata >> 184) & 255, 1);
        eq((metadata >> 160) & 65535, 32);
        eq((metadata >> 176) & 255, 1);
        eq(state.load(address(records), keccak256(abi.encode(small, uint256(1)))), bytes32(uint256(3000)));
        bytes memory large = new bytes(4096);
        large[0] = 0x0f;
        large[1] = 0xfe;
        for (uint256 i = 2; i < large.length; ++i) {
            large[i] = 0xff;
        }
        bytes32 big = records.storeRecord(ids[1], large);
        slot = keccak256(abi.encode(big, uint256(0)));
        metadata = uint256(state.load(address(records), bytes32(uint256(slot) + 1)));
        eq((metadata >> 184) & 255, 0);
        eq((metadata >> 160) & 65535, 4096);
        address pointer = address(uint160(metadata));
        eq(pointer.code, bytes.concat(hex"00", large));
        eq(records.readRecord(big).body, large);
        vm.expectRevert(NativeRecordKernel.BodyTooLarge.selector);
        records.storeRecord(ids[1], new bytes(4097));
    }

    function testCanonicalQuoteProducerPathAndIndependentReader() public {
        (NativeKernel k, bytes32[] memory ids) = candidate();
        QuoteProducer producer = new QuoteProducer(k, ids[0]);
        QuoteReader reader = new QuoteReader();
        producer.publish(3000, 0);
        producer.publish(3100, 1);
        (uint256 value, bytes32 file, uint64 revision) = reader.read(k, address(producer), ids[0]);
        eq(value, 3100);
        eq(file, producer.quoteFile());
        eq(revision, 2);
        eq(abi.decode(k.readRecord(k.revisionAt(file, 1).recordId).body, (uint256)), 3000);
    }

    function testActualPayloadConsumerReadsCanonicalFraming() public {
        bytes memory helperCode = vm.getCode("test/fixtures/canonical-preparation-helper.json");
        address helper;
        assembly { helper := create(0, add(helperCode, 32), mload(helperCode)) }
        bytes memory code = bytes.concat(vm.getCode("NativeKernel.sol:NativeKernel"), abi.encode(helper));
        address deployed;
        assembly { deployed := create(0, add(code, 32), mload(code)) }
        NativeKernel k = NativeKernel(deployed);
        (, bytes32[] memory ids) = k.types().registerGroup(CanonicalFixtures.group_defaults());
        bytes32 root = k.ensureRoot();
        bytes32 file = k.createFile(root, "binary", ids[1], hex"0004ef008000");
        CanonicalPayloadConsumer consumer = new CanonicalPayloadConsumer(ids[1]);
        bytes[] memory path = new bytes[](1);
        path[0] = "binary";
        consumer.capture(k, address(this), path);
        eq(consumer.lastDigest(), keccak256(hex"ef008000"));
        eq(consumer.lastLength(), 4);
        eq(consumer.lastRevision(), 1);
        eq(consumer.lastRecordId(), k.fileInfo(file).recordId);
    }

    // Catches the actual storage path retaining the deployment-native Record domain.
    function testActualLegacyRecordDoesNotHaveCanonicalIdentity() public {
        bytes memory code = vm.getCode("test/fixtures/native-kernel-4cb0042.json");
        address deployed;
        assembly { deployed := create(0, add(code, 32), mload(code)) }
        NativeKernel old = NativeKernel(deployed);
        bytes memory validatorCode = vm.getCode("test/fixtures/uint-validator-4cb0042.json");
        address validator;
        assembly { validator := create(0, add(validatorCode, 32), mload(validatorCode)) }
        bytes32 t = ExactTypeRegistry(address(old.types())).register("quote:uint256", validator);
        bytes memory b = abi.encode(uint256(3000));
        bytes32 actual = old.storeRecord(t, b);
        require(
            actual != keccak256(abi.encode(keccak256("efs2/record/1"), t, keccak256(b))),
            "historical Record identity must stay distinct"
        );
    }

    // The desired candidate constructor must wire its actual Files registry, not a standalone store.
    function testActualFilesCanonicalGroupRecordAndDiscovery() public {
        bytes memory helperCode = vm.getCode("test/fixtures/canonical-preparation-helper.json");
        address helper;
        assembly { helper := create(0, add(helperCode, 32), mload(helperCode)) }
        bytes memory code = bytes.concat(vm.getCode("NativeKernel.sol:NativeKernel"), abi.encode(helper));
        address deployed;
        assembly { deployed := create(0, add(code, 32), mload(code)) }
        require(deployed != address(0), "actual Files deployment");
        NativeKernel k = NativeKernel(deployed);
        (bool registered, bytes memory response) = address(k.types())
            .call(abi.encodeCall(CanonicalRegistryFilesApi.registerGroup, (CanonicalFixtures.group_defaults())));
        require(registered, "actual registry canonical group unsupported");
        (, bytes32[] memory ids) = abi.decode(response, (bytes32, bytes32[]));
        bytes memory b = abi.encode(uint256(3000));
        bytes32 expected = keccak256(abi.encode(keccak256("efs2/record/1"), ids[0], keccak256(b)));
        bytes32 root = k.ensureRoot();
        bytes32 file = k.createFile(root, "quote", ids[0], b);
        eq(k.fileInfo(file).recordId, expected);
        eq(k.readRecord(expected).body, b);
        k.discovery().attach(ids[0], true);
        DiscoveryIndex discovery = k.discovery();
        vm.expectRevert(DiscoveryIndex.UnsupportedType.selector);
        vm.prank(address(0xbeef));
        discovery.attach(ids[1], false);
    }
}
