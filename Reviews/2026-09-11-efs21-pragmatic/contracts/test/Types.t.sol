// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {TestBase} from "./TestBase.sol";
import {LegacyExactTypeRegistry as ExactTypeRegistry, LegacyUint256Validator as Uint256Validator, LegacyBytesValidator as BytesValidator} from "./fixtures/legacy4cb/LegacyExactTypeRegistry.sol";

contract RegistryHarness is ExactTypeRegistry {
    function probe(address validator, bytes memory body) external view returns (bool) {
        return _boundedValidate(validator, body);
    }
}

contract HostileValidator {
    uint256 public touched;

    // 0=false, 1=revert, 2=noncanonical bool, 3=short, 4=bomb, 5=OOG, 6=state mutation.
    fallback() external {
        uint256 mode;
        assembly { mode := calldataload(68) }
        if (mode == 1) revert();
        if (mode == 2) {
            assembly {
                mstore(0, 2)
                return(0, 32)
            }
        }
        if (mode == 3) {
            assembly {
                mstore(0, 1)
                return(0, 1)
            }
        }
        if (mode == 4) {
            assembly {
                mstore(0, 1)
                return(0, 65536)
            }
        }
        if (mode == 5) assembly { for {} 1 {} {} }
        if (mode == 6) touched = 1;
        assembly {
            mstore(0, 0)
            return(0, 32)
        }
    }
}

contract TypesTest is TestBase {
    RegistryHarness registry;
    Uint256Validator uintValidator;
    BytesValidator bytesValidator;

    function setUp() public {
        registry = new RegistryHarness();
        uintValidator = new Uint256Validator();
        bytesValidator = new BytesValidator();
    }

    function testDescriptorRetainedPortableBoundedAndImmutable() public {
        bytes memory descriptor = bytes("EFS21 opaque descriptor; canonical ABI uint256 quote");
        bytes32 id = registry.register(descriptor, address(uintValidator));
        eq(registry.descriptorOf(id), descriptor);
        eq(
            id,
            keccak256(abi.encode(keccak256("EFS21_TYPE_V1"), keccak256(descriptor), address(uintValidator).codehash))
        );
        Uint256Validator same = new Uint256Validator();
        eq(registry.register(descriptor, address(same)), id);
        eq(registry.typeInfo(id).validator, address(uintValidator));
        vm.expectRevert();
        registry.register(new bytes(1025), address(uintValidator));
        vm.expectRevert();
        registry.register(bytes(""), address(uintValidator));
        vm.expectRevert();
        registry.descriptorOf(bytes32(uint256(999)));
    }

    // Catches permissioned registration and mutable schema/validator identities.
    function testPermissionlessExactTypeRegistration() public {
        bytes memory descriptor = bytes("quote(uint256)");
        bytes32 schema = keccak256(descriptor);
        vm.prank(address(0x1234));
        bytes32 id = registry.register(descriptor, address(uintValidator));
        eq(id, keccak256(abi.encode(keccak256("EFS21_TYPE_V1"), schema, address(uintValidator).codehash)));
        Uint256Validator sameCode = new Uint256Validator();
        eq(registry.register(descriptor, address(sameCode)), id);
        eq(registry.register(descriptor, address(uintValidator)), id);
        yes(registry.register(bytes("other"), address(uintValidator)) != id);
        ExactTypeRegistry.TypeInfo memory info = registry.typeInfo(id);
        eq(info.schemaHash, schema);
        eq(info.validator, address(uintValidator));
        registry.validate(id, abi.encode(uint256(42)));
    }

    // Catches accepting truncated or trailing uint bytes.
    function testUintMalformedRejected() public {
        bytes32 id = registry.register(bytes("uint"), address(uintValidator));
        vm.expectRevert();
        registry.validate(id, hex"01");
        vm.expectRevert();
        registry.validate(id, new bytes(64));
    }

    // Catches accepting noncanonical dynamic ABI or padding, including empty bytes.
    function testBytesCanonicalAndMalformed() public {
        bytes32 id = registry.register(bytes("bytes"), address(bytesValidator));
        registry.validate(id, abi.encode(bytes("hello")));
        registry.validate(id, abi.encode(bytes("")));
        vm.expectRevert();
        registry.validate(id, bytes("hello"));
        bytes memory wrongOffset = abi.encode(bytes("x"));
        wrongOffset[31] = 0x40;
        vm.expectRevert();
        registry.validate(id, wrongOffset);
        bytes memory padding = abi.encode(bytes("x"));
        padding[95] = 0x01;
        vm.expectRevert();
        registry.validate(id, padding);
        vm.expectRevert();
        registry.validate(id, abi.encodePacked(abi.encode(bytes("x")), bytes32(0)));
        bytes memory hugeLength = abi.encode(uint256(32), type(uint256).max);
        vm.expectRevert();
        registry.validate(id, hugeLength);
    }

    // Catches permissionless admission of unreviewed mutable validation code.
    function testUnreviewedAndMissingValidatorsRejected() public {
        HostileValidator hostile = new HostileValidator();
        vm.expectRevert();
        registry.register(bytes("x"), address(hostile));
        vm.expectRevert();
        registry.register(bytes("x"), address(0x5678));
        vm.expectRevert();
        registry.validate(bytes32(uint256(1)), abi.encode(uint256(1)));
    }

    // Catches relying on an address after its code changed/disappeared.
    function testChangedAndMissingRuntimeRejected() public {
        bytes32 id = registry.register(bytes("uint"), address(uintValidator));
        vm.etch(address(uintValidator), hex"60006000f3");
        vm.expectRevert();
        registry.validate(id, abi.encode(uint256(1)));
        vm.etch(address(uintValidator), hex"");
        vm.expectRevert();
        registry.validate(id, abi.encode(uint256(1)));
    }

    // Test-only harness exercises the actual bounded-call primitive against hostile runtimes.
    function testBoundedStaticcallRejectsHostileResponses() public {
        HostileValidator hostile = new HostileValidator();
        for (uint256 i; i < 7; ++i) {
            yes(!registry.probe(address(hostile), abi.encode(i)));
        }
        eq(hostile.touched(), 0);
        yes(registry.probe(address(uintValidator), abi.encode(uint256(1))));
    }
}
