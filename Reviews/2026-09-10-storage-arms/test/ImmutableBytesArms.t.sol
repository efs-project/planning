// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {
    IBytesArm,
    StateBytes,
    CodeBytes,
    DedupBytes,
    Descriptor,
    Missing,
    TooLarge,
    InvalidPayload
} from "../src/ImmutableBytesArms.sol";

interface Vm {
    function expectRevert() external;
    function expectRevert(bytes4) external;
    function prank(address) external;
    function etch(address, bytes calldata) external;
    function store(address, bytes32, bytes32) external;
}

// With --isolate, each call into this probe is a fresh top-level EVM context.
// Two nested arm reads remain in that SAME context; no cheatcode changes warmth.
contract GasProbe {
    function deployments() external returns (uint256 stateCost, uint256 codeCost, uint256 dedupCost) {
        uint256 before = gasleft();
        StateBytes s = new StateBytes();
        stateCost = before - gasleft();
        before = gasleft();
        CodeBytes c = new CodeBytes();
        codeCost = before - gasleft();
        before = gasleft();
        DedupBytes d = new DedupBytes();
        dedupCost = before - gasleft();
        require(
            address(s).code.length > 0 && address(c).code.length > 0 && address(d).code.length > 0, "deployments exist"
        );
    }

    function reads(IBytesArm target, bytes32 id, uint256 length, bytes32 hash)
        external
        view
        returns (uint256 first, uint256 second)
    {
        uint256 before = gasleft();
        bytes memory a = target.read(id);
        first = before - gasleft();
        before = gasleft();
        bytes memory b = target.read(id);
        second = before - gasleft();
        require(
            a.length == length && keccak256(a) == hash && b.length == length && keccak256(b) == hash, "probe exact read"
        );
    }

    function write(IBytesArm target, bytes calldata body) external returns (uint256 cost) {
        uint256 before = gasleft();
        bytes32 id = target.put(body);
        cost = before - gasleft();
        require(keccak256(target.read(id)) == keccak256(body), "probe exact write");
    }

    function referenceWrite(DedupBytes target, bytes32 revision, uint256 position, bytes32 id)
        external
        returns (uint256 cost)
    {
        uint256 before = gasleft();
        target.putReference(address(this), revision, position, id);
        cost = before - gasleft();
        require(target.referenceId(address(this), revision, position) == id, "probe reference");
    }

    function referenceReads(DedupBytes target, bytes32 revision, bytes32 hash)
        external
        view
        returns (uint256 first, uint256 second)
    {
        uint256 before = gasleft();
        bytes memory a = target.readReference(address(this), revision, 0);
        first = before - gasleft();
        before = gasleft();
        bytes memory b = target.readReference(address(this), revision, 0);
        second = before - gasleft();
        require(keccak256(a) == hash && keccak256(b) == hash, "probe reference reads");
    }
}

contract GasMeasurementsTest {
    event log(string);
    event log_named_uint(string key, uint256 value);

    struct Fixture {
        StateBytes state;
        CodeBytes code;
        DedupBytes dedup;
        bytes32 s;
        bytes32 c;
        bytes32 d;
    }
    Fixture[14] private fixtures;
    GasProbe private probe;

    // This setup and all payload creation occur outside the measured probe calls.
    function setUp() public {
        probe = new GasProbe();
        for (uint256 i; i < 14; ++i) {
            Fixture storage f = fixtures[i];
            f.state = new StateBytes();
            f.code = new CodeBytes();
            f.dedup = new DedupBytes();
            bytes memory body = payload(i);
            f.s = f.state.put(body);
            f.c = f.code.put(body);
            f.d = f.dedup.put(body);
            probe.referenceWrite(f.dedup, bytes32(uint256(1)), 0, f.d);
        }
    }

    function payload(uint256 i) internal pure returns (bytes memory body) {
        uint256[7] memory sizes = [uint256(0), 1, 31, 32, 33, 1024, 4096];
        body = new bytes(sizes[i / 2]);
        if (i % 2 == 1) {
            for (uint256 j; j < body.length; ++j) {
                body[j] = bytes1(uint8(j % 255 + 1));
            }
        }
    }

    function heading(uint256 i) internal {
        emit log_named_uint("size", payload(i).length);
        emit log_named_uint("nonzero", i % 2);
    }

    function testMeasureColdAndWarmReads() public {
        for (uint256 i; i < 14; ++i) {
            Fixture storage f = fixtures[i];
            bytes memory body = payload(i);
            heading(i);
            (uint256 cold, uint256 warm) = probe.reads(f.state, f.s, body.length, keccak256(body));
            require(cold > warm + 10000, "state must actually be cold then warm");
            emit log_named_uint("state cold", cold);
            emit log_named_uint("state warm", warm);
            (cold, warm) = probe.reads(f.code, f.c, body.length, keccak256(body));
            require(cold > warm + 10000, "code must actually be cold then warm");
            emit log_named_uint("code cold", cold);
            emit log_named_uint("code warm", warm);
            (cold, warm) = probe.reads(f.dedup, f.d, body.length, keccak256(body));
            require(cold > warm + 10000, "dedup must actually be cold then warm");
            emit log_named_uint("dedup cold", cold);
            emit log_named_uint("dedup warm", warm);
            (cold, warm) = probe.referenceReads(f.dedup, bytes32(uint256(1)), keccak256(body));
            require(cold > warm + 10000, "reference must actually be cold then warm");
            emit log_named_uint("reference cold", cold);
            emit log_named_uint("reference warm", warm);
        }
    }

    function testMeasureFirstRepeatChangedAndReferences() public {
        for (uint256 i; i < 14; ++i) {
            Fixture storage f = fixtures[i];
            bytes memory body = payload(i);
            heading(i);
            // New control instances: first write has no prior content or sequence.
            StateBytes emptyState = new StateBytes();
            CodeBytes emptyCode = new CodeBytes();
            DedupBytes emptyDedup = new DedupBytes();
            emit log_named_uint("state first", probe.write(emptyState, body));
            emit log_named_uint("code first", probe.write(emptyCode, body));
            emit log_named_uint("dedup first", probe.write(emptyDedup, body));
            emit log_named_uint("state repeat", probe.write(f.state, body));
            emit log_named_uint("code repeat", probe.write(f.code, body));
            emit log_named_uint("dedup repeat", probe.write(f.dedup, body));
            // Different exact revision and different position reuse the already uploaded content.
            emit log_named_uint("reference repeat", probe.referenceWrite(f.dedup, bytes32(uint256(1)), 0, f.d));
            emit log_named_uint("reference different file", probe.referenceWrite(f.dedup, bytes32(uint256(2)), 0, f.d));
            emit log_named_uint(
                "reference different position", probe.referenceWrite(f.dedup, bytes32(uint256(1)), 1, f.d)
            );
            // Empty has no different byte value at equal length; its changed fixture is one byte.
            if (body.length == 0) body = hex"ff";
            else body[0] = bytes1(uint8(body[0]) ^ 0xff);
            emit log_named_uint("state changed", probe.write(f.state, body));
            emit log_named_uint("code changed", probe.write(f.code, body));
            emit log_named_uint("dedup changed", probe.write(f.dedup, body));
        }
    }

    function testMeasureArmDeployments() public {
        (uint256 stateCost, uint256 codeCost, uint256 dedupCost) = probe.deployments();
        emit log_named_uint("StateBytes CREATE execution", stateCost);
        emit log_named_uint("CodeBytes CREATE execution", codeCost);
        emit log_named_uint("DedupBytes CREATE execution", dedupCost);
    }
}

// Installed after writes, pins retained data; no calls to any writer or its helpers.
contract IndependentPinnedReader {
    bytes32 private immutable referenceCommitment;

    constructor(address publisher, bytes32 revision, uint256 position, Descriptor memory d) {
        referenceCommitment = keccak256(abi.encode(publisher, revision, position, d));
    }

    function read(address publisher, bytes32 revision, uint256 position, Descriptor calldata d)
        external
        view
        returns (bytes memory body)
    {
        require(keccak256(abi.encode(publisher, revision, position, d)) == referenceCommitment, "reference pin");
        address pointer = d.pointer;
        uint256 size;
        bytes32 identity;
        assembly {
            size := extcodesize(pointer)
            identity := extcodehash(pointer)
        }
        require(pointer != address(0) && d.length <= 24575 && size == uint256(d.length) + 1, "exact code size");
        require(identity == d.codeHash, "code identity");
        bytes memory prefix = new bytes(1);
        body = new bytes(d.length);
        assembly {
            extcodecopy(pointer, add(prefix, 32), 0, 1)
            extcodecopy(pointer, add(body, 32), 1, mload(body))
        }
        require(prefix[0] == 0 && keccak256(body) == d.contentHash, "exact content");
    }
}

contract CodeBytesTest {
    Vm constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    CodeBytes code;
    DedupBytes dedup;
    bytes32 constant REV_A = bytes32(uint256(0xa1));
    bytes32 constant REV_B = bytes32(uint256(0xb2));
    address constant ALICE = address(0xa11ce);
    address constant BOB = address(0xb0b);

    function setUp() public {
        code = new CodeBytes();
        dedup = new DedupBytes();
    }

    function testCodeAndDedupSizeMatrix() public {
        uint256[7] memory sizes = [uint256(0), 1, 31, 32, 33, 1024, 4096];
        for (uint256 arm; arm < 2; ++arm) {
            IBytesArm target = arm == 0 ? IBytesArm(address(code)) : IBytesArm(address(dedup));
            for (uint256 i; i < sizes.length; ++i) {
                for (uint256 p; p < 2; ++p) {
                    bytes memory body = new bytes(sizes[i]);
                    if (p == 1) {
                        for (uint256 j; j < body.length; ++j) {
                            body[j] = bytes1(uint8(j % 255 + 1));
                        }
                    }
                    bytes32 id = target.put(body);
                    bytes memory got = target.read(id);
                    require(got.length == body.length && keccak256(got) == keccak256(body), "matrix mismatch");
                    Descriptor memory d = CodeBytes(address(target)).descriptor(id);
                    IndependentPinnedReader fresh = new IndependentPinnedReader(ALICE, REV_A, 0, d);
                    bytes memory independent = fresh.read(ALICE, REV_A, 0, d);
                    require(
                        independent.length == body.length && keccak256(independent) == keccak256(body),
                        "independent matrix mismatch"
                    );
                }
            }
        }
    }

    // Fails if empty content is treated as an absent pointer.
    function testEmptyIsRealStopAndLiteralCommitment() public {
        for (uint256 arm; arm < 2; ++arm) {
            CodeBytes target = arm == 0 ? code : dedup;
            bytes32 id = target.put("");
            Descriptor memory d = target.descriptor(id);
            require(d.pointer != address(0) && d.pointer.code.length == 1, "real empty payload");
            require(keccak256(d.pointer.code) == keccak256(hex"00"), "STOP only");
            require(
                d.contentHash == 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470,
                "literal empty hash"
            );
            require(target.read(id).length == 0, "read empty");
        }
    }

    function testRepeatedCodeAllocatesButDedupReusesAcrossFilesAndPositions() public {
        bytes32 c1 = code.put(hex"616263");
        bytes32 c2 = code.put(hex"616263");
        require(code.descriptor(c1).pointer != code.descriptor(c2).pointer, "non-dedup control");
        bytes32 id = dedup.put(hex"616263");
        bytes32 again = dedup.put(hex"616263");
        bytes32 changed = dedup.put(hex"616264");
        require(id == again && changed != id, "content-only identity");
        require(id == 0x4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45, "literal abc hash");
        require(dedup.descriptor(id).pointer != dedup.descriptor(changed).pointer, "different bytes must not alias");
        for (uint256 r; r < 2; ++r) {
            for (uint256 p; p < 2; ++p) {
                bytes32 revision = r == 0 ? REV_A : REV_B;
                vm.prank(ALICE);
                dedup.putReference(ALICE, revision, p, id);
                require(dedup.referenceId(ALICE, revision, p) == id, "cross reference reuse");
                require(keccak256(dedup.readReference(ALICE, revision, p)) == keccak256(hex"616263"), "reference read");
            }
        }
        vm.prank(ALICE);
        dedup.putReference(ALICE, REV_A, 0, id);
        vm.expectRevert();
        vm.prank(ALICE);
        dedup.putReference(ALICE, REV_A, 0, changed);
        require(dedup.referenceId(ALICE, REV_A, 0) == id, "reference not overwritten");
    }

    function testUploadsDoNotGrantOtherPublisherReferenceAuthority() public {
        vm.prank(BOB);
        bytes32 id = dedup.put(hex"616263");
        vm.expectRevert();
        vm.prank(BOB);
        dedup.putReference(ALICE, REV_A, 0, id);
        vm.expectRevert();
        dedup.referenceId(ALICE, REV_A, 0);
        vm.prank(ALICE);
        dedup.putReference(ALICE, REV_A, 0, id);
        vm.prank(BOB);
        dedup.putReference(BOB, REV_A, 0, id);
        bytes32 changed = dedup.put(hex"616264");
        vm.expectRevert();
        vm.prank(BOB);
        dedup.putReference(ALICE, REV_A, 0, changed);
        require(dedup.referenceId(ALICE, REV_A, 0) == id, "publisher pin");
        vm.expectRevert();
        vm.prank(ALICE);
        dedup.putReference(ALICE, REV_A, 1, bytes32(uint256(77)));
    }

    function testIndependentReaderSurvivesWriterRemovalAndRejectsSubstitution() public {
        bytes32 id = dedup.put(hex"616263");
        vm.prank(ALICE);
        dedup.putReference(ALICE, REV_A, 0, id);
        Descriptor memory retained = dedup.descriptor(dedup.referenceId(ALICE, REV_A, 0));
        // Independent verifier is deployed only AFTER the original content and reference writes.
        IndependentPinnedReader fresh = new IndependentPinnedReader(ALICE, REV_A, 0, retained);
        address substitute = code.descriptor(code.put(hex"616263")).pointer;
        require(
            substitute != retained.pointer && substitute.codehash == retained.codeHash,
            "identical different address fixture"
        );
        vm.expectRevert();
        dedup.readAt(id, substitute);
        vm.etch(address(dedup), hex"");
        require(
            keccak256(fresh.read(ALICE, REV_A, 0, retained))
                == 0x4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45,
            "writer-free literal read"
        );
        vm.expectRevert();
        fresh.read(BOB, REV_A, 0, retained);
        vm.expectRevert();
        fresh.read(ALICE, REV_B, 0, retained);
        vm.expectRevert();
        fresh.read(ALICE, REV_A, 1, retained);
        Descriptor memory swapped = Descriptor(substitute, retained.length, retained.contentHash, retained.codeHash);
        vm.expectRevert();
        fresh.read(ALICE, REV_A, 0, swapped);
        retained.length = 4;
        vm.expectRevert();
        fresh.read(ALICE, REV_A, 0, retained);
    }

    // Truncating all-zero bytes would pass a hash-only EXTCODECOPY check due to zero padding.
    function testRejectsAlteredTruncatedAndMissingCode() public {
        for (uint256 arm; arm < 2; ++arm) {
            for (uint256 mutation; mutation < 3; ++mutation) {
                CodeBytes target = arm == 0 ? code : dedup;
                bytes32 id = target.put(hex"000000");
                Descriptor memory d = target.descriptor(id);
                IndependentPinnedReader fresh = new IndependentPinnedReader(ALICE, REV_A, 0, d);
                require(fresh.read(ALICE, REV_A, 0, d).length == 3, "valid prestate");
                bytes memory bad =
                    mutation == 0 ? bytes(hex"00000001") : mutation == 1 ? bytes(hex"0000") : bytes(hex"");
                vm.etch(d.pointer, bad);
                vm.expectRevert();
                target.read(id);
                vm.expectRevert();
                fresh.read(ALICE, REV_A, 0, d);
                if (arm == 1) {
                    vm.expectRevert();
                    dedup.put(hex"000000");
                    vm.expectRevert();
                    vm.prank(ALICE);
                    dedup.putReference(ALICE, REV_A, 0, id);
                }
                // Restore before attempting dedup reuse in the next fixture.
                vm.etch(d.pointer, hex"00000000");
            }
        }
    }

    function testCodeMissingAndMaxBoundary() public {
        for (uint256 arm; arm < 2; ++arm) {
            CodeBytes target = arm == 0 ? code : dedup;
            vm.expectRevert(Missing.selector);
            target.read(bytes32(uint256(777)));
            bytes memory body = new bytes(24575);
            bytes32 id = target.put(body);
            require(target.descriptor(id).pointer.code.length == 24576, "runtime boundary");
            require(target.read(id).length == 24575, "max body");
            vm.expectRevert(TooLarge.selector);
            target.put(new bytes(24576));
            vm.expectRevert(TooLarge.selector);
            target.put(new bytes(49152));
        }
    }

    // Test-only state/code fault injection isolates each validation gate, not a supported mutation API.
    function testIndependentLengthHashAndPrefixChecks() public {
        bytes32 id = code.put(hex"616263");
        Descriptor memory valid = code.descriptor(id);
        Descriptor memory wrong = Descriptor(valid.pointer, 4, valid.contentHash, valid.codeHash);
        IndependentPinnedReader fresh = new IndependentPinnedReader(ALICE, REV_A, 0, wrong);
        vm.expectRevert();
        fresh.read(ALICE, REV_A, 0, wrong);
        wrong = Descriptor(valid.pointer, 3, bytes32(uint256(1)), valid.codeHash);
        fresh = new IndependentPinnedReader(ALICE, REV_A, 0, wrong);
        vm.expectRevert();
        fresh.read(ALICE, REV_A, 0, wrong);
        vm.etch(valid.pointer, hex"01616263");
        wrong = Descriptor(valid.pointer, 3, valid.contentHash, keccak256(hex"01616263"));
        fresh = new IndependentPinnedReader(ALICE, REV_A, 0, wrong);
        vm.expectRevert();
        fresh.read(ALICE, REV_A, 0, wrong);
        // Production descriptor mapping is slot 1: packed pointer+length, then body hash, then code hash.
        bytes32 base = keccak256(abi.encode(id, uint256(1)));
        vm.store(address(code), bytes32(uint256(base) + 2), wrong.codeHash);
        vm.expectRevert(InvalidPayload.selector);
        code.read(id);
        vm.etch(valid.pointer, hex"00616263");
        vm.store(address(code), bytes32(uint256(base) + 2), valid.codeHash);
        vm.store(address(code), base, bytes32(uint256(uint160(valid.pointer)) | (uint256(4) << 160)));
        vm.expectRevert(InvalidPayload.selector);
        code.read(id);
        vm.store(address(code), base, bytes32(uint256(uint160(valid.pointer)) | (uint256(3) << 160)));
        vm.store(address(code), bytes32(uint256(base) + 1), bytes32(uint256(1)));
        vm.expectRevert(InvalidPayload.selector);
        code.read(id);
    }
}

contract StateBytesTest {
    Vm constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    StateBytes state;

    function setUp() public {
        state = new StateBytes();
    }

    // Catches missing writes, mistaken repeat aliasing and changed-byte overwrite.
    function testStateExactRepeatAndDifferent() public {
        bytes32 a = state.put(hex"616263");
        bytes32 b = state.put(hex"616263");
        bytes32 c = state.put(hex"616264");
        require(a != b && b != c && a != c, "control allocates independent ids");
        require(
            keccak256(state.read(a)) == 0x4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45,
            "literal abc hash"
        );
        require(keccak256(state.read(b)) == keccak256(hex"616263"), "repeat exact");
        require(keccak256(state.read(c)) == keccak256(hex"616264"), "different exact");
    }

    // Catches the Solidity short/long bytes transition and zero-filled loss.
    function testStateSizeMatrix() public {
        uint256[7] memory sizes = [uint256(0), 1, 31, 32, 33, 1024, 4096];
        for (uint256 i; i < sizes.length; ++i) {
            for (uint256 p; p < 2; ++p) {
                bytes memory body = new bytes(sizes[i]);
                if (p == 1) {
                    for (uint256 j; j < body.length; ++j) {
                        body[j] = bytes1(uint8(j % 255 + 1));
                    }
                }
                bytes memory got = state.read(state.put(body));
                require(got.length == body.length && keccak256(got) == keccak256(body), "matrix mismatch");
            }
        }
    }

    function testStateMissingAndMaxRejected() public {
        vm.expectRevert(Missing.selector);
        state.read(bytes32(uint256(777)));
        require(state.read(state.put(new bytes(24575))).length == 24575, "state max boundary");
        vm.expectRevert(TooLarge.selector);
        state.put(new bytes(24576));
    }

    function testStateRejectsWrongLengthAndContentCommitment() public {
        bytes32 id = state.put(hex"616263");
        bytes32 base = keccak256(abi.encode(id, uint256(1)));
        vm.store(address(state), bytes32(uint256(base) + 1), bytes32(uint256(4)));
        vm.expectRevert(InvalidPayload.selector);
        state.read(id);
        vm.store(address(state), bytes32(uint256(base) + 1), bytes32(uint256(3)));
        vm.store(address(state), bytes32(uint256(base) + 2), bytes32(uint256(1)));
        vm.expectRevert(InvalidPayload.selector);
        state.read(id);
    }
}
