// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {CanonicalFixtures} from "./fixtures/CanonicalFixtures.sol";
import {CanonicalHelperIdentity} from "../src/CanonicalHelperIdentity.sol";
import {TestBase} from "./TestBase.sol";
import {Preparation, IPreparation} from "C0Core/Preparation.sol";

interface RegistryApi {
    struct TypeInfo {
        bytes32 groupId;
        uint16 memberIndex;
        bytes32 blobHash;
        address cacheCode;
        uint32 cacheLength;
        bytes32 cacheHash;
    }
    function registerGroup(bytes calldata) external returns (bytes32, bytes32[] memory);
    function groupBytes(bytes32) external view returns (bytes memory);
    function typeInfo(bytes32) external view returns (TypeInfo memory);
    function cacheBytes(bytes32) external view returns (bytes memory);
    function isUint256(bytes32) external view returns (bool);
    function validate(bytes32, bytes calldata) external view;
}

interface VmCanonical {
    function getNonce(address) external view returns (uint64);
    function load(address, bytes32) external view returns (bytes32);
    function store(address, bytes32, bytes32) external;
    function mockCall(address, bytes calldata, bytes calldata) external;
    function clearMockedCalls() external;
}

// Adversarial CALL responses exercise the actual bounded Preparation library only;
// these targets can never satisfy the product registry's fixed helper identity.
contract PreparationInvokeHarness {
    function invoke(address target, uint256 maximum) external view returns (bytes memory) {
        return Preparation.invoke(Preparation.Config(target, target.codehash), hex"01020304", maximum, 100_000);
    }

    function group(address target) external view returns (Preparation.CompiledGroup memory) {
        return Preparation.group(Preparation.Config(target, target.codehash), hex"0001");
    }
}

contract HostilePreparation {
    uint256 private mode;

    constructor(uint256 value) {
        mode = value;
    }

    fallback() external {
        uint256 m = mode;
        if (m == 0) assembly { return(0, 131073) }
        if (m == 1) assembly { revert(0, 1025) }
        if (m == 2) assembly { return(0, 1) }
        if (m == 3) mode = 4;
        if (m == 4) assembly { for {} 1 {} {} }
    }
}

contract CanonicalTypesTest is TestBase {
    VmCanonical private constant v = VmCanonical(address(vm));
    RegistryApi private r;
    address private helper;

    function deploy(bytes memory code) private returns (address a) {
        assembly { a := create(0, add(code, 32), mload(code)) }
    }

    function setUp() public {
        helper = deploy(vm.getCode("test/fixtures/canonical-preparation-helper.json"));
        require(helper.codehash == CanonicalHelperIdentity.EXPECTED_RUNTIME_HASH, "standalone helper identity");
        r = RegistryApi(
            deploy(bytes.concat(vm.getCode("CanonicalTypeRegistry.sol:CanonicalTypeRegistry"), abi.encode(helper)))
        );
        require(address(r) != address(0), "registry deployed");
    }

    function refused(bytes memory callData, bytes4 selector) private {
        (bool ok, bytes memory data) = address(r).call{gas: 16_000_000}(callData);
        require(!ok, "must refuse");
        if (selector != bytes4(0)) require(bytes4(data) == selector, "exact refusal selector");
    }

    function testFrozenLegacyRegistrationRemainsUnsupported() public {
        address old = deploy(vm.getCode("test/fixtures/native-kernel-4cb0042.json"));
        (bool exists, bytes memory out) = old.staticcall(abi.encodeWithSignature("types()"));
        require(exists, "frozen control deployed");
        (bool ok,) = abi.decode(out, (address))
            .call(abi.encodeWithSignature("registerGroup(bytes)", CanonicalFixtures.group_defaults()));
        require(!ok, "legacy is not canonical registry");
    }

    function testWrongAndMissingHelperCannotBecomeCanonical() public {
        bytes memory code = vm.getCode("CanonicalTypeRegistry.sol:CanonicalTypeRegistry");
        eq(deploy(bytes.concat(code, abi.encode(address(0)))), address(0));
        vm.etch(address(0x1234), hex"00");
        eq(deploy(bytes.concat(code, abi.encode(address(0x1234)))), address(0));
    }

    function testActualBoundedPreparationRejectsBombsMalformedAndStatefulHelpers() public {
        PreparationInvokeHarness h = new PreparationInvokeHarness();
        for (uint256 i; i < 5; ++i) {
            address hostile = address(new HostilePreparation(i));
            (bool ok, bytes memory data) = i == 2
                ? address(h).call(abi.encodeCall(h.group, (hostile)))
                : address(h).call(abi.encodeCall(h.invoke, (hostile, 131072)));
            require(!ok, "hostile helper refused");
            if (i < 2) require(bytes4(data) == Preparation.HelperOutput.selector, "bounded response before copy");
        }
    }

    function testReturnedCachePointersAreNotTrustedWithoutPhysicalChecks() public {
        Preparation.CompiledGroup memory g = Preparation.group(
            Preparation.Config(helper, CanonicalHelperIdentity.EXPECTED_RUNTIME_HASH),
            CanonicalFixtures.group_defaults()
        );
        bytes memory selector = abi.encodePacked(IPreparation.deployCache.selector);
        v.mockCall(helper, selector, abi.encode(address(0)));
        refused(
            abi.encodeCall(r.registerGroup, (CanonicalFixtures.group_defaults())), Preparation.HelperDeploy.selector
        );
        v.clearMockedCalls();
        v.mockCall(helper, selector, hex"01");
        refused(
            abi.encodeCall(r.registerGroup, (CanonicalFixtures.group_defaults())), Preparation.HelperDeploy.selector
        );
        v.clearMockedCalls();
        address target = address(0xdddd);
        v.mockCall(helper, selector, abi.encode(target));
        refused(
            abi.encodeCall(r.registerGroup, (CanonicalFixtures.group_defaults())), bytes4(keccak256("CorruptCache()"))
        );
        bytes memory fake = bytes.concat(hex"01", g.types[0].cacheBytes);
        vm.etch(target, fake);
        refused(
            abi.encodeCall(r.registerGroup, (CanonicalFixtures.group_defaults())), bytes4(keccak256("CorruptCache()"))
        );
        fake[0] = 0;
        fake[fake.length - 1] ^= 0x01;
        vm.etch(target, fake);
        refused(
            abi.encodeCall(r.registerGroup, (CanonicalFixtures.group_defaults())), bytes4(keccak256("CorruptCache()"))
        );
        v.clearMockedCalls();
        r.registerGroup(CanonicalFixtures.group_defaults());
    }

    function testCanonicalRegistrationRetainsIdentityCacheOriginAndNoopRepeat() public {
        bytes memory raw = CanonicalFixtures.group_defaults();
        uint64 nonce = v.getNonce(helper);
        vm.prank(address(0x1234));
        (bytes32 group, bytes32[] memory ids) = r.registerGroup(raw);
        eq(group, keccak256(abi.encode(keccak256("efs2/typeschema-group/1"), keccak256(raw))));
        eq(ids.length, 2);
        eq(v.getNonce(helper), nonce + 2);
        eq(r.groupBytes(group), raw);
        for (uint256 i; i < 2; ++i) {
            eq(ids[i], keccak256(abi.encode(keccak256("efs2/typeschema/1"), group, i)));
            RegistryApi.TypeInfo memory t = r.typeInfo(ids[i]);
            eq(t.groupId, group);
            eq(t.memberIndex, i);
            eq(t.cacheHash, keccak256(r.cacheBytes(ids[i])));
            eq(t.cacheCode.code.length, uint256(t.cacheLength) + 1);
            require(t.cacheCode.code[0] == 0, "cache STOP");
        }
        yes(r.isUint256(ids[0]));
        require(!r.isUint256(ids[1]), "bytes is not uint");
        address first = r.typeInfo(ids[0]).cacheCode;
        r.validate(ids[0], abi.encode(uint256(3000)));
        r.validate(ids[1], hex"0000");
        r.registerGroup(raw);
        eq(v.getNonce(helper), nonce + 2);
        eq(r.typeInfo(ids[0]).cacheCode, first);
    }

    function testRefusalBeforeAnyFirstMemberDeployment() public {
        uint64 nonce = v.getNonce(helper);
        bytes[] memory raws = new bytes[](9);
        raws[0] = CanonicalFixtures.group_ref();
        raws[1] = CanonicalFixtures.group_occref();
        raws[2] = CanonicalFixtures.group_optionalRef();
        raws[3] = CanonicalFixtures.group_zeroArrayRef();
        raws[4] = CanonicalFixtures.group_self();
        raws[5] = CanonicalFixtures.group_sibling();
        raws[6] = CanonicalFixtures.group_external();
        raws[7] = CanonicalFixtures.group_secondUnsupported();
        raws[8] = CanonicalFixtures.group_index();
        for (uint256 i; i < raws.length; ++i) {
            refused(
                abi.encodeCall(r.registerGroup, (raws[i])),
                i == 8 ? bytes4(keccak256("UnsupportedIndexes()")) : bytes4(keccak256("UnsupportedReferences()"))
            );
        }
        refused(
            abi.encodeCall(r.registerGroup, (CanonicalFixtures.group_digestIndex())),
            bytes4(keccak256("UnsupportedIndexes()"))
        );
        eq(v.getNonce(helper), nonce);
    }

    function testSecondActualHelperCreateCollisionRollsBackFirst() public {
        uint64 nonce = v.getNonce(helper);
        require(nonce < 127, "small fixture nonce");
        address first = address(uint160(uint256(keccak256(abi.encodePacked(hex"d694", helper, uint8(nonce))))));
        address second = address(uint160(uint256(keccak256(abi.encodePacked(hex"d694", helper, uint8(nonce + 1))))));
        vm.etch(second, hex"00");
        refused(
            abi.encodeCall(r.registerGroup, (CanonicalFixtures.group_defaults())), bytes4(keccak256("HelperDeploy()"))
        );
        eq(v.getNonce(helper), nonce);
        eq(first.code.length, 0);
        eq(second.code.length, 1);
        bytes32 group =
            keccak256(abi.encode(keccak256("efs2/typeschema-group/1"), keccak256(CanonicalFixtures.group_defaults())));
        refused(abi.encodeCall(r.groupBytes, (group)), bytes4(keccak256("UnknownGroup()")));
    }

    function testHelperOutageStopsValidationAndRepeat() public {
        (, bytes32[] memory ids) = r.registerGroup(CanonicalFixtures.group_defaults());
        vm.etch(helper, hex"00");
        refused(abi.encodeCall(r.validate, (ids[0], abi.encode(uint256(0)))), bytes4(keccak256("HelperIdentity()")));
        refused(
            abi.encodeCall(r.registerGroup, (CanonicalFixtures.group_defaults())), bytes4(keccak256("HelperIdentity()"))
        );
    }

    function testReservedIdsRefuseEvenWithoutTypeAndBodyBoundIsExplicit() public {
        bytes32[4] memory ids = [
            CanonicalFixtures.RESERVED_0,
            CanonicalFixtures.RESERVED_1,
            CanonicalFixtures.RESERVED_2,
            CanonicalFixtures.RESERVED_3
        ];
        for (uint256 i; i < 4; ++i) {
            refused(abi.encodeCall(r.validate, (ids[i], bytes(""))), bytes4(keccak256("ReservedType()")));
        }
        (, bytes32[] memory actual) = r.registerGroup(CanonicalFixtures.group_defaults());
        refused(abi.encodeCall(r.validate, (actual[1], new bytes(4097))), bytes4(keccak256("BodyTooLarge()")));
        refused(abi.encodeCall(r.validate, (bytes32(uint256(999)), bytes(""))), bytes4(keccak256("UnknownType()")));
    }

    function testCacheAndAssociationCorruptionRefuse() public {
        (, bytes32[] memory ids) = r.registerGroup(CanonicalFixtures.group_defaults());
        RegistryApi.TypeInfo memory info = r.typeInfo(ids[0]);
        bytes memory code = info.cacheCode.code;
        code[0] = 0x01;
        vm.etch(info.cacheCode, code);
        refused(abi.encodeCall(r.cacheBytes, (ids[0])), bytes4(keccak256("CorruptCache()")));
        code[0] = 0;
        code[code.length - 1] ^= 0x01;
        vm.etch(info.cacheCode, code);
        refused(
            abi.encodeCall(r.registerGroup, (CanonicalFixtures.group_defaults())), bytes4(keccak256("CorruptCache()"))
        );
    }

    function testSwappedPointerAndGroupMemberAssociationRefuse() public {
        (, bytes32[] memory ids) = r.registerGroup(CanonicalFixtures.group_defaults());
        bytes32 slot = keccak256(abi.encode(ids[0], uint256(1)));
        bytes32 original = v.load(address(r), slot);
        v.store(address(r), slot, bytes32(uint256(999)));
        refused(abi.encodeCall(r.typeInfo, (ids[0])), bytes4(keccak256("CorruptCache()")));
        v.store(address(r), slot, original);
        bytes32 memberSlot = bytes32(uint256(slot) + 1);
        bytes32 oldMember = v.load(address(r), memberSlot);
        v.store(address(r), memberSlot, bytes32(uint256(1)));
        refused(abi.encodeCall(r.cacheBytes, (ids[0])), bytes4(keccak256("CorruptCache()")));
        v.store(address(r), memberSlot, oldMember);
        RegistryApi.TypeInfo memory b = r.typeInfo(ids[1]);
        bytes32 pointerSlot = bytes32(uint256(slot) + 3);
        bytes32 oldPointer = v.load(address(r), pointerSlot);
        v.store(
            address(r),
            pointerSlot,
            bytes32((uint256(oldPointer) & ~uint256(type(uint160).max)) | uint256(uint160(b.cacheCode)))
        );
        refused(abi.encodeCall(r.cacheBytes, (ids[0])), bytes4(keccak256("CorruptCache()")));
        v.store(address(r), pointerSlot, oldPointer);
        r.validate(ids[0], abi.encode(uint256(0)));
    }

    function testMissingShortLongAndPayloadRetargetedCacheRefuse() public {
        (, bytes32[] memory ids) = r.registerGroup(CanonicalFixtures.group_defaults());
        RegistryApi.TypeInfo memory info = r.typeInfo(ids[0]);
        bytes memory original = info.cacheCode.code;
        vm.etch(info.cacheCode, hex"");
        refused(abi.encodeCall(r.cacheBytes, (ids[0])), bytes4(keccak256("CorruptCache()")));
        vm.etch(info.cacheCode, hex"00");
        refused(abi.encodeCall(r.cacheBytes, (ids[0])), bytes4(keccak256("CorruptCache()")));
        vm.etch(info.cacheCode, bytes.concat(original, hex"00"));
        refused(abi.encodeCall(r.cacheBytes, (ids[0])), bytes4(keccak256("CorruptCache()")));
        vm.etch(info.cacheCode, original);
        bytes32 slot = keccak256(abi.encode(ids[0], uint256(1)));
        v.store(address(r), bytes32(uint256(slot) + 2), bytes32(uint256(123)));
        refused(abi.encodeCall(r.validate, (ids[0], abi.encode(uint256(0)))), bytes4(keccak256("CorruptCache()")));
    }

    function testMalformedGroupAndLargeLegalCacheRefuseAtomically() public {
        refused(abi.encodeCall(r.registerGroup, (hex"0000")), bytes4(keccak256("InvalidSchema()")));
        refused(abi.encodeCall(r.registerGroup, (hex"0011")), bytes4(keccak256("InvalidSchema()")));
        refused(
            abi.encodeCall(r.registerGroup, (bytes.concat(CanonicalFixtures.group_defaults(), hex"00"))),
            bytes4(keccak256("InvalidSchema()"))
        );
        uint64 nonce = v.getNonce(helper);
        refused(
            abi.encodeCall(r.registerGroup, (CanonicalFixtures.group_boundary())), bytes4(keccak256("HelperDeploy()"))
        );
        eq(v.getNonce(helper), nonce);
    }

    function scalarRaw(string memory name) private pure returns (bytes memory) {
        bytes memory b = abi.encodePacked(
            uint16(1),
            uint16(bytes(name).length),
            bytes(name),
            uint16(0),
            uint8(0),
            bytes32(0),
            uint16(1),
            uint16(5),
            bytes("value"),
            uint8(2),
            uint8(32),
            uint16(0),
            uint16(0),
            uint16(0),
            uint16(0)
        );
        return abi.encodePacked(uint16(1), uint16(b.length), b);
    }

    function testChangedNameOrderAndCopiedReservedNameHaveDistinctCanonicalIdentity() public {
        (bytes32 a, bytes32[] memory ai) = r.registerGroup(scalarRaw("BindingSet/1"));
        (bytes32 b, bytes32[] memory bi) = r.registerGroup(scalarRaw("BindingSet/2"));
        require(
            a != b && ai[0] != bi[0] && ai[0] != CanonicalFixtures.RESERVED_0, "exact identity not a name reservation"
        );
        r.validate(ai[0], abi.encode(uint256(1)));
        bytes memory raw = CanonicalFixtures.group_defaults();
        uint256 n = uint256(uint8(raw[2])) * 256 + uint8(raw[3]);
        bytes memory reverse = new bytes(raw.length);
        reverse[1] = 0x02;
        uint256 p = 2;
        for (uint256 i = 4 + n; i < raw.length; ++i) {
            reverse[p++] = raw[i];
        }
        for (uint256 i = 2; i < 4 + n; ++i) {
            reverse[p++] = raw[i];
        }
        (a, ai) = r.registerGroup(raw);
        (b, bi) = r.registerGroup(reverse);
        require(a != b && ai[0] != bi[1] && ai[1] != bi[0], "group order belongs to identity");
    }

    function testMalformedDescriptorCountsNamesAndMaximumCanonicalBody() public {
        refused(abi.encodeCall(r.registerGroup, (new bytes(8191))), bytes4(keccak256("InvalidSchema()")));
        refused(abi.encodeCall(r.registerGroup, (scalarRaw(""))), bytes4(keccak256("InvalidSchema()")));
        bytes memory raw = scalarRaw("Bad/1");
        // group4 + version2 + nameLength2 + name5 + meaningLength2 + flag1 + qualifier32.
        raw[48] = 0;
        raw[49] = 0x41;
        refused(abi.encodeCall(r.registerGroup, (raw)), bytes4(keccak256("InvalidSchema()")));
        (, bytes32[] memory ids) = r.registerGroup(CanonicalFixtures.group_defaults());
        bytes memory body = new bytes(4096);
        body[0] = 0x0f;
        body[1] = 0xfe;
        r.validate(ids[1], body);
        // A reserved guard still wins over forced test-only presence metadata.
        bytes32 slot = keccak256(abi.encode(CanonicalFixtures.RESERVED_0, uint256(1)));
        v.store(address(r), slot, r.typeInfo(ids[0]).groupId);
        refused(abi.encodeCall(r.validate, (CanonicalFixtures.RESERVED_0, body)), bytes4(keccak256("ReservedType()")));
    }
}
