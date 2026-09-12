// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {TestBase} from "./TestBase.sol";
import {LegacyNativeKernel as NativeKernel} from "./fixtures/legacy4cb/LegacyNativeKernel.sol";
import {LegacyExactTypeRegistry as ExactTypeRegistry, LegacyUint256Validator as Uint256Validator, LegacyBytesValidator as BytesValidator} from "./fixtures/legacy4cb/LegacyExactTypeRegistry.sol";
import {LegacyNavigationIndex as NavigationIndex} from "./fixtures/legacy4cb/LegacyNavigationIndex.sol";
import {LegacyExpandedTypeRegistry as ExpandedTypeRegistry} from "./fixtures/legacy4cb/LegacyExpandedTypeRegistry.sol";
import {HostileValidator} from "./Types.t.sol";
import {LegacyDiscoveryIndex as DiscoveryIndex} from "./fixtures/legacy4cb/LegacyDiscoveryIndex.sol";

contract ExpandedHarness is ExpandedTypeRegistry {
    function probe(address validator, bytes memory body) external view returns (bool) {
        return _boundedValidate(validator, body);
    }
}

contract RawTest is TestBase {
    NativeKernel kernel;
    bytes32 rawType;
    bytes32 canonicalType;
    address rawValidator;

    function setUp() public {
        kernel = new NativeKernel();
        // Load the candidate runtime as an artifact, leaving original validator sources untouched.
        bytes memory creation = vm.getCode("LegacyRawBytesValidator.sol:LegacyRawBytesValidator");
        assembly { sstore(rawValidator.slot, create(0, add(creation, 32), mload(creation))) }
        rawType = kernel.types().register("EFS21 exact raw bytes v1", rawValidator);
        canonicalType = kernel.types().register("EFS21 canonical ABI bytes v1", address(new BytesValidator()));
    }

    function testEmptyRawPresenceDedupAndDistinctTypes() public {
        bytes32 id = kernel.storeRecord(rawType, "");
        eq(id, keccak256(abi.encode(keccak256("EFS21_RECORD_V1"), rawType, bytes(""))));
        eq(kernel.readRecord(id).body, bytes(""));
        eq(kernel.readRecord(id).typeId, rawType);
        eq(kernel.storeRecord(rawType, ""), id);
        NavigationIndex.Page memory page =
            kernel.navigation().typeInventory(rawType, NavigationIndex.Cursor(0, 0, 0), 64);
        eq(page.ids.length, 1);
        vm.expectRevert(NativeKernel.MissingRecord.selector);
        kernel.readRecord(bytes32(uint256(999)));
        bytes memory framed = abi.encode(bytes(""));
        yes(kernel.storeRecord(rawType, framed) != kernel.storeRecord(canonicalType, framed));
    }

    function testPatternsAndBodyBoundaries() public {
        uint256[11] memory sizes = [uint256(0), 1, 31, 32, 33, 41, 256, 4032, 4033, 4096, 4097];
        for (uint256 p; p < 3; ++p) {
            for (uint256 i; i < sizes.length; ++i) {
                bytes memory payload = new bytes(sizes[i]);
                for (uint256 j; j < payload.length; ++j) {
                    // j % 256 is within uint8 range; this fixture deliberately repeats binary bytes.
                    // forge-lint: disable-next-line(unsafe-typecast)
                    payload[j] = p == 0 ? bytes1(0) : p == 1 ? bytes1(0xef) : bytes1(uint8(j % 256));
                }
                if (sizes[i] > 4096) {
                    vm.expectRevert(NativeKernel.BodyTooLarge.selector);
                    kernel.storeRecord(rawType, payload);
                } else {
                    eq(kernel.readRecord(kernel.storeRecord(rawType, payload)).body, payload);
                }
                if (sizes[i] > 4032) {
                    vm.expectRevert(NativeKernel.BodyTooLarge.selector);
                    kernel.storeRecord(canonicalType, abi.encode(payload));
                } else {
                    eq(
                        abi.decode(
                            kernel.readRecord(kernel.storeRecord(canonicalType, abi.encode(payload))).body, (bytes)
                        ),
                        payload
                    );
                }
            }
        }
        bytes memory binary = hex"ef0080ff00112200";
        eq(kernel.readRecord(kernel.storeRecord(rawType, binary)).body, binary);
    }

    function testDefaultSemanticsCrossTypeHistoryRenameUnlink() public {
        bytes32 root = kernel.ensureRoot();
        bytes32 file = kernel.createFile(root, "raw", rawType, hex"ef0000");
        bytes32 first = kernel.fileInfo(file).recordId;
        kernel.editFile(file, 1, rawType, hex"ef0000");
        eq(kernel.fileInfo(file).revision, 2);
        kernel.editFile(file, 2, canonicalType, abi.encode(hex"ef0000"));
        bytes32 second = kernel.fileInfo(file).recordId;
        yes(first != second);
        kernel.moveFile(file, 3, root, "renamed");
        kernel.unlink(file, 4);
        eq(kernel.revisionAt(file, 1).recordId, first);
        eq(kernel.revisionAt(file, 2).recordId, first);
        eq(kernel.revisionAt(file, 3).recordId, second);
        eq(kernel.revisionAt(file, 5).recordId, second);
        eq(kernel.readRecord(first).body, hex"ef0000");
        eq(abi.decode(kernel.readRecord(second).body, (bytes)), hex"ef0000");
    }

    function testChangedAndMissingValidatorRejectDuplicateAdmission() public {
        kernel.storeRecord(rawType, "");
        bytes memory original = rawValidator.code;
        vm.etch(rawValidator, hex"00");
        vm.expectRevert(ExactTypeRegistry.ValidatorCodeChanged.selector);
        kernel.storeRecord(rawType, "");
        vm.etch(rawValidator, "");
        vm.expectRevert(ExactTypeRegistry.ValidatorCodeChanged.selector);
        kernel.storeRecord(rawType, "");
        vm.etch(rawValidator, original);
        kernel.storeRecord(rawType, "");
    }

    function testLateRequiredIndexFailureAndDuplicateNameRollback() public {
        bytes32 root = kernel.ensureRoot();
        bytes32 file = kernel.createFile(root, "taken", rawType, "");
        uint256 nonce = kernel.fileNonce(address(this));
        bytes32 unique = kernel.recordId(rawType, hex"ff0011");
        vm.expectRevert();
        kernel.createFile(root, "taken", rawType, hex"ff0011");
        vm.expectRevert(NativeKernel.MissingRecord.selector);
        kernel.readRecord(unique);
        eq(kernel.fileNonce(address(this)), nonce);
        // Late mandatory hook failure, after body/presence/inventory/file/history writes.
        address nav = address(kernel.discovery());
        bytes memory code = nav.code;
        vm.etch(nav, hex"60006000fd");
        vm.expectRevert();
        kernel.createFile(root, "other", rawType, hex"ff0011");
        vm.expectRevert();
        kernel.editFile(file, 1, rawType, hex"ff0011");
        vm.etch(nav, code);
        vm.expectRevert(NativeKernel.MissingRecord.selector);
        kernel.readRecord(unique);
        eq(kernel.fileNonce(address(this)), nonce);
        eq(kernel.fileInfo(file).revision, 1);
        vm.expectRevert();
        kernel.revisionAt(file, 2);
        eq(kernel.navigation().typeInventory(rawType, NavigationIndex.Cursor(0, 0, 0), 64).ids.length, 1);
        eq(kernel.navigation().fileInventory(address(this), NavigationIndex.Cursor(0, 0, 0), 64).ids.length, 2);
        eq(kernel.lookup(address(this), root, "other"), bytes32(0));
    }

    function testExpandedRegistryKeepsBoundedValidationAndScalarRestriction() public {
        ExpandedHarness registry = new ExpandedHarness();
        HostileValidator hostile = new HostileValidator();
        for (uint256 mode; mode < 7; ++mode) {
            yes(!registry.probe(address(hostile), abi.encode(mode)));
        }
        eq(hostile.touched(), 0);
        vm.expectRevert();
        registry.register("hostile", address(hostile));
        vm.expectRevert();
        registry.register("missing", address(0x1234));
        DiscoveryIndex discovery = kernel.discovery();
        vm.expectRevert();
        discovery.attach(rawType, true);
        bytes memory wrong = abi.encode(bytes("x"));
        wrong[31] = 0x40;
        vm.expectRevert();
        kernel.storeRecord(canonicalType, wrong);
        wrong = abi.encode(bytes("x"));
        wrong[95] = 0xff;
        vm.expectRevert();
        kernel.storeRecord(canonicalType, wrong);
        wrong = abi.encode(uint256(32), type(uint256).max);
        vm.expectRevert();
        kernel.storeRecord(canonicalType, wrong);
    }
}
