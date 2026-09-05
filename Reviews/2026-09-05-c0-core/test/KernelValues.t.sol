// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {TypeGroupParser} from "C0Admission/TypeGroupParser.sol";
import {RecordBody} from "../src/RecordBody.sol";
import {BindingFold} from "../src/BindingFold.sol";
import {IndexKeys} from "../src/IndexKeys.sol";

interface VmKernelValues {
    function readFile(string calldata) external view returns (string memory);
    function parseJsonString(string calldata, string calldata) external pure returns (string memory);
    function parseBytes(string calldata) external pure returns (bytes memory);
    function toString(uint256) external pure returns (string memory);
}

contract KernelValuesHarness {
    function decode(BindingFold.KernelIds memory ids, bytes32 typeId, RecordBody.CheckedBody memory body)
        external
        pure
        returns (BindingFold.Effect memory)
    {
        return BindingFold.decode(ids, typeId, body);
    }

    function advance(
        bytes32 key,
        BindingFold.Head memory beforeHead,
        BindingFold.OccurrenceRef memory beforeSource,
        BindingFold.Effect memory effect,
        uint32 expectedRevision,
        uint64 newOrdinal
    ) external pure returns (BindingFold.Head memory) {
        return BindingFold.advance(key, beforeHead, beforeSource, effect, expectedRevision, newOrdinal);
    }

    function withdrawHead(bytes32 key, BindingFold.Head memory beforeHead, uint64 newOrdinal)
        external
        pure
        returns (BindingFold.Head memory)
    {
        return BindingFold.withdrawHead(key, beforeHead, newOrdinal);
    }

    function pack(BindingFold.Head memory head) external pure returns (uint256, bytes32) {
        return BindingFold.pack(head);
    }

    function unpack(uint256 meta, bytes32 target) external pure returns (BindingFold.Head memory) {
        return BindingFold.unpack(meta, target);
    }

    function occurrenceKeys(
        TypeGroupParser.SchemaCache memory schema,
        RecordBody.CheckedBody memory body,
        bytes32 recordId,
        bytes32 principalId
    ) external pure returns (bytes32[] memory) {
        return IndexKeys.occurrenceKeys(schema, body, recordId, principalId);
    }

    function digest(uint16 algorithm, bytes memory value) external pure returns (bytes32) {
        return IndexKeys.digest(algorithm, value);
    }
}

contract KernelValuesTest {
    VmKernelValues constant vm = VmKernelValues(address(uint160(uint256(keccak256("hevm cheat code")))));
    KernelValuesHarness h = new KernelValuesHarness();
    bytes32 constant KEY = bytes32(uint256(0xbeef));
    bytes32 constant PURPOSE = bytes32(uint256(0x11));
    bytes32 constant SUBJECT = bytes32(uint256(0x22));
    bytes32 constant FIELD_ROLE = bytes32(uint256(0x33));
    bytes32 constant TARGET = bytes32(uint256(0x10000));

    function testFirstBindLiteral() public view {
        BindingFold.Head memory afterHead = h.advance(
            KEY,
            BindingFold.Head(0, 0, 0, 0, 0, bytes32(0), 0),
            BindingFold.OccurrenceRef(bytes32(0), 0),
            setEffect(1, TARGET, 0, false, bytes32(0), 0),
            0,
            7
        );
        assertHead(afterHead, 1, 1, 7, 1, TARGET, 0, 0);
    }

    function testActualGroupTwoDecodeAndExactKernelDispatch() public view {
        (BindingFold.KernelIds memory ids, TypeGroupParser.SchemaCache[] memory schemas) = kernelSchemas();
        bytes32 predecessorEnvelope = bytes32(uint256(0x20000));
        RecordBody.CheckedBody memory body = RecordBody.validate(
            schemas[0],
            bytes.concat(
                abi.encodePacked(PURPOSE, SUBJECT, FIELD_ROLE),
                hex"01",
                abi.encodePacked(TARGET),
                hex"00",
                hex"01",
                abi.encodePacked(predecessorEnvelope, uint16(513))
            )
        );
        BindingFold.Effect memory e = h.decode(ids, ids.setType, body);
        require(e.kind == 1 && e.purpose == PURPOSE && e.subject == SUBJECT && e.fieldRole == FIELD_ROLE, "set tuple");
        require(e.targetKind == 1 && e.targetA == TARGET && e.targetLeaf == 0, "set record target");
        require(
            e.predecessorPresent && e.predecessor.envelopeId == predecessorEnvelope && e.predecessor.leafIndex == 513,
            "set predecessor"
        );

        bytes32 targetEnvelope = bytes32(uint256(0x30000));
        body = RecordBody.validate(
            schemas[0],
            bytes.concat(
                abi.encodePacked(PURPOSE, SUBJECT, FIELD_ROLE),
                hex"00",
                hex"01",
                abi.encodePacked(targetEnvelope, uint16(65535)),
                hex"00"
            )
        );
        e = h.decode(ids, ids.setType, body);
        require(e.targetKind == 2 && e.targetA == targetEnvelope && e.targetLeaf == 65535, "occurrence target");
        require(!e.predecessorPresent, "predecessor none");

        body = RecordBody.validate(schemas[1], bytes.concat(abi.encodePacked(PURPOSE, SUBJECT, FIELD_ROLE), hex"00"));
        e = h.decode(ids, ids.tombstoneType, body);
        require(e.kind == 2 && e.targetKind == 0 && !e.predecessorPresent, "tombstone decode");
        body = RecordBody.validate(schemas[2], abi.encodePacked(targetEnvelope, uint16(42)));
        e = h.decode(ids, ids.withdrawalType, body);
        require(
            e.kind == 3 && e.targetKind == 2 && e.targetA == targetEnvelope && e.targetLeaf == 42, "withdraw decode"
        );

        RecordBody.CheckedBody memory empty;
        e = h.decode(ids, keccak256("same-shaped ordinary type"), empty);
        require(e.kind == 0, "non-kernel remains ordinary");
    }

    function testBindingSetRequiresExactlyOneTarget() public view {
        (BindingFold.KernelIds memory ids, TypeGroupParser.SchemaCache[] memory schemas) = kernelSchemas();
        RecordBody.CheckedBody memory neither =
            RecordBody.validate(schemas[0], bytes.concat(abi.encodePacked(PURPOSE, SUBJECT, FIELD_ROLE), hex"000000"));
        expectError(
            abi.encodeCall(h.decode, (ids, ids.setType, neither)),
            abi.encodeWithSelector(RecordBody.InvalidBody.selector, uint16(17))
        );
        RecordBody.CheckedBody memory both = RecordBody.validate(
            schemas[0],
            bytes.concat(
                abi.encodePacked(PURPOSE, SUBJECT, FIELD_ROLE),
                hex"01",
                abi.encodePacked(TARGET),
                hex"01",
                abi.encodePacked(bytes32(uint256(0x20000)), uint16(9)),
                hex"00"
            )
        );
        expectError(
            abi.encodeCall(h.decode, (ids, ids.setType, both)),
            abi.encodeWithSelector(RecordBody.InvalidBody.selector, uint16(17))
        );
    }

    function testTransitionsT2ThroughT6AndTargetClearing() public view {
        BindingFold.OccurrenceRef memory src = BindingFold.OccurrenceRef(bytes32(uint256(0xaaaa)), 4);
        BindingFold.Head memory bound = BindingFold.Head(1, 1, 0, 7, 20, TARGET, 0);
        BindingFold.Head memory out = h.advance(
            KEY, bound, src, setEffect(2, bytes32(uint256(0x40000)), 77, true, src.envelopeId, src.leafIndex), 7, 21
        );
        assertHead(out, 1, 8, 21, 2, bytes32(uint256(0x40000)), 77, 0);
        out = h.advance(KEY, bound, src, tombstoneEffect(true, src.envelopeId, src.leafIndex), 7, 22);
        assertHead(out, 2, 8, 22, 0, bytes32(0), 0, 1);

        out = h.advance(
            KEY,
            BindingFold.Head(0, 0, 0, 0, 0, bytes32(0), 0),
            BindingFold.OccurrenceRef(bytes32(0), 0),
            tombstoneEffect(false, bytes32(0), 0),
            0,
            5
        );
        assertHead(out, 2, 1, 5, 0, bytes32(0), 0, 1);

        BindingFold.Head memory tomb = BindingFold.Head(2, 0, 1, 9, 30, bytes32(0), 0);
        src = BindingFold.OccurrenceRef(bytes32(uint256(0xbbbb)), 6);
        out = h.advance(KEY, tomb, src, setEffect(1, TARGET, 0, true, src.envelopeId, src.leafIndex), 9, 31);
        assertHead(out, 1, 10, 31, 1, TARGET, 0, 0);
        out = h.advance(KEY, tomb, src, tombstoneEffect(true, src.envelopeId, src.leafIndex), 9, 32);
        assertHead(out, 2, 10, 32, 0, bytes32(0), 0, 1);
    }

    function testWithdrawCurrentBoundAndTombstoneHeads() public view {
        BindingFold.Head memory out = h.withdrawHead(KEY, BindingFold.Head(1, 1, 0, 3, 8, TARGET, 0), 9);
        assertHead(out, 2, 4, 9, 0, bytes32(0), 0, 2);
        out = h.withdrawHead(KEY, BindingFold.Head(2, 0, 1, 4, 9, bytes32(0), 0), 10);
        assertHead(out, 2, 5, 10, 0, bytes32(0), 0, 2);
    }

    function testCasPredecessorAndRevisionErrorsCarryCurrentHead() public view {
        BindingFold.Head memory beforeHead = BindingFold.Head(1, 1, 0, 12, 44, TARGET, 0);
        BindingFold.OccurrenceRef memory source = BindingFold.OccurrenceRef(bytes32(uint256(0xabcde)), 15);
        BindingFold.Effect memory stale = setEffect(1, TARGET, 0, true, bytes32(uint256(0xdead)), 9);
        expectError(
            abi.encodeCall(h.advance, (KEY, beforeHead, source, stale, uint32(12), uint64(45))),
            abi.encodeWithSelector(
                BindingFold.ErrCasPredecessor.selector, KEY, source.envelopeId, source.leafIndex, uint64(44), uint32(12)
            )
        );
        BindingFold.Effect memory current = setEffect(1, TARGET, 0, true, source.envelopeId, source.leafIndex);
        expectError(
            abi.encodeCall(h.advance, (KEY, beforeHead, source, current, uint32(11), uint64(45))),
            abi.encodeWithSelector(BindingFold.ErrCasRevision.selector, KEY, uint32(11), uint32(12))
        );
    }

    function testRevisionAndOrdinalGuards() public view {
        BindingFold.OccurrenceRef memory src = BindingFold.OccurrenceRef(bytes32(uint256(0xaaaa)), 1);
        BindingFold.Effect memory e = setEffect(1, TARGET, 0, true, src.envelopeId, src.leafIndex);
        BindingFold.Head memory exhausted = BindingFold.Head(1, 1, 0, type(uint32).max - 1, 9, TARGET, 0);
        expectError(
            abi.encodeCall(h.advance, (KEY, exhausted, src, e, type(uint32).max - 1, uint64(10))),
            abi.encodeWithSelector(BindingFold.ErrRevisionGuard.selector, KEY)
        );
        BindingFold.Head memory head = BindingFold.Head(1, 1, 0, 1, 9, TARGET, 0);
        expectSelector(
            abi.encodeCall(h.advance, (KEY, head, src, e, uint32(1), uint64(9))), BindingFold.InvalidOrdinal.selector
        );
        expectSelector(
            abi.encodeCall(h.advance, (KEY, head, src, e, uint32(1), (uint64(1) << 48) - 1)),
            BindingFold.InvalidOrdinal.selector
        );
        expectSelector(abi.encodeCall(h.withdrawHead, (KEY, head, uint64(0))), BindingFold.InvalidOrdinal.selector);
    }

    function testPositionAndBindingLiteralPreimagesPreserveFullPrincipal() public pure {
        BindingFold.Effect memory e;
        e.purpose = PURPOSE;
        e.subject = SUBJECT;
        e.fieldRole = FIELD_ROLE;
        bytes32 position = keccak256(abi.encode(keccak256("efs2/position/1"), PURPOSE, SUBJECT, FIELD_ROLE));
        require(BindingFold.positionKey(e) == position, "literal position preimage");
        bytes32 p1 = bytes32(uint256(0x1234));
        bytes32 p2 = bytes32((uint256(1) << 255) | uint256(0x1234));
        require(
            BindingFold.bindingKey(p1, position) == keccak256(abi.encode(keccak256("efs2/binding/1"), p1, position)),
            "literal binding preimage"
        );
        require(BindingFold.bindingKey(p1, position) != BindingFold.bindingKey(p2, position), "full principal width");
    }

    function testPackLiteralBoundsAndReservedReadBits() public view {
        BindingFold.Head memory bound = BindingFold.Head(1, 2, 0, 0x11223344, 0x010203040506, TARGET, 0x7788);
        uint256 expected = uint256(1) | (uint256(0x11223344) << 8) | (uint256(0x010203040506) << 40)
            | (uint256(2) << 88) | (uint256(0x7788) << 104);
        (uint256 meta, bytes32 target) = h.pack(bound);
        require(meta == expected && target == TARGET, "literal two-word packing");
        BindingFold.Head memory decoded = h.unpack(meta | (uint256(1) << 255), target);
        assertHead(decoded, 1, 0x11223344, 0x010203040506, 2, TARGET, 0x7788, 0);
        (meta, target) = h.pack(BindingFold.Head(0, 0, 0, 0, 0, bytes32(0), 0));
        require(meta == 0 && target == bytes32(0), "zero head");
        h.pack(BindingFold.Head(1, 1, 0, 1, 1, TARGET, 0));
        h.pack(BindingFold.Head(2, 0, 2, type(uint32).max - 1, (uint64(1) << 48) - 2, bytes32(0), 0));
    }

    function testPackRejectsInvalidStateTargetAndBounds() public view {
        expectSelector(
            abi.encodeCall(h.pack, (BindingFold.Head(3, 0, 0, 1, 1, bytes32(0), 0))), BindingFold.InvalidHead.selector
        );
        expectSelector(
            abi.encodeCall(h.pack, (BindingFold.Head(1, 0, 0, 1, 1, TARGET, 0))), BindingFold.InvalidHead.selector
        );
        expectSelector(
            abi.encodeCall(h.pack, (BindingFold.Head(1, 1, 0, 1, 1, TARGET, 1))), BindingFold.InvalidHead.selector
        );
        expectSelector(
            abi.encodeCall(h.pack, (BindingFold.Head(2, 0, 0, 1, 1, bytes32(0), 0))), BindingFold.InvalidHead.selector
        );
        expectSelector(
            abi.encodeCall(h.pack, (BindingFold.Head(2, 0, 1, 1, 1, TARGET, 0))), BindingFold.InvalidHead.selector
        );
        expectSelector(
            abi.encodeCall(h.pack, (BindingFold.Head(1, 1, 0, type(uint32).max, 1, TARGET, 0))),
            BindingFold.InvalidHead.selector
        );
        expectSelector(
            abi.encodeCall(h.pack, (BindingFold.Head(1, 1, 0, 1, (uint64(1) << 48) - 1, TARGET, 0))),
            BindingFold.InvalidHead.selector
        );
    }

    function testFuzzLawfulHeadsPackAndUnpackExact(
        uint32 revisionSeed,
        uint64 ordinalSeed,
        bytes32 targetSeed,
        uint16 leaf,
        bool occurrence,
        bool tombstone
    ) public view {
        uint32 revision = uint32(uint256(revisionSeed) % (uint256(type(uint32).max) - 2)) + 1;
        uint64 ordinal = uint64(uint256(ordinalSeed) % ((uint256(1) << 48) - 2)) + 1;
        bytes32 target = targetSeed == bytes32(0) ? TARGET : targetSeed;
        BindingFold.Head memory original = tombstone
            ? BindingFold.Head(2, 0, occurrence ? 2 : 1, revision, ordinal, bytes32(0), 0)
            : BindingFold.Head(1, occurrence ? 2 : 1, 0, revision, ordinal, target, occurrence ? leaf : 0);
        (uint256 meta, bytes32 targetWord) = h.pack(original);
        BindingFold.Head memory decoded = h.unpack(meta, targetWord);
        require(keccak256(abi.encode(decoded)) == keccak256(abi.encode(original)), "lawful exact roundtrip");
    }

    function testFuzzSameKeyCasSuccessHasExactFields(
        uint32 revisionSeed,
        uint64 ordinalSeed,
        bytes32 sourceSeed,
        uint16 sourceLeaf,
        bytes32 targetSeed,
        uint16 targetLeaf,
        bool occurrence
    ) public view {
        uint32 revision = uint32(uint256(revisionSeed) % (uint256(type(uint32).max) - 2)) + 1;
        uint64 ordinal = uint64(uint256(ordinalSeed) % ((uint256(1) << 48) - 3)) + 1;
        bytes32 sourceId = sourceSeed == bytes32(0) ? bytes32(uint256(0x20000)) : sourceSeed;
        bytes32 targetId = targetSeed == bytes32(0) ? TARGET : targetSeed;
        BindingFold.OccurrenceRef memory source = BindingFold.OccurrenceRef(sourceId, sourceLeaf);
        BindingFold.Head memory beforeHead = BindingFold.Head(1, 1, 0, revision, ordinal, TARGET, 0);
        BindingFold.Head memory afterHead = h.advance(
            KEY,
            beforeHead,
            source,
            setEffect(occurrence ? 2 : 1, targetId, occurrence ? targetLeaf : 0, true, sourceId, sourceLeaf),
            revision,
            ordinal + 1
        );
        assertHead(
            afterHead, 1, revision + 1, ordinal + 1, occurrence ? 2 : 1, targetId, occurrence ? targetLeaf : 0, 0
        );
    }

    function testPostingScalarOccurrenceAndDigestLiteralPreimages() public view {
        bytes32 recordId = bytes32(uint256(0x10101));
        bytes32 expected = keccak256(abi.encode(keccak256("efs2/pk/1"), bytes32(0), uint256(3), uint256(0), recordId));
        require(IndexKeys.posting(bytes32(0), 3, 0, recordId) == expected, "literal posting preimage");
        require(
            IndexKeys.scalar(hex"0003616263")
                == keccak256(abi.encode(keccak256("efs2/vk/scalar/1"), keccak256(hex"0003616263"))),
            "scalar prefix"
        );
        require(IndexKeys.scalar(hex"0003616263") != IndexKeys.scalar(hex"616263"), "prefix framing differs");
        require(
            IndexKeys.occurrenceTarget(bytes32(uint256(0xffff)), 65535)
                == keccak256(abi.encode(keccak256("efs2/vk/occ/1"), bytes32(uint256(0xffff)), uint256(65535))),
            "full leaf"
        );
        uint16[5] memory algorithms = [uint16(0x11), 0x12, 0x13, 0x1b, 0xef01];
        uint16[5] memory lengths = [uint16(20), 32, 64, 32, 20];
        for (uint256 i; i < algorithms.length; ++i) {
            bytes memory value = new bytes(lengths[i]);
            value[0] = bytes1(uint8(i + 1));
            require(
                h.digest(algorithms[i], value)
                    == keccak256(abi.encode(keccak256("efs2/vk/digest/1"), uint256(algorithms[i]), keccak256(value))),
                "digest row"
            );
        }
        expectSelector(abi.encodeCall(h.digest, (uint16(0xffff), new bytes(32))), IndexKeys.InvalidDigest.selector);
        expectSelector(abi.encodeCall(h.digest, (uint16(0x12), new bytes(31))), IndexKeys.InvalidDigest.selector);
    }

    function testScopeLiteralPreimage() public pure {
        bytes32 principal = bytes32((uint256(1) << 255) | 7);
        require(
            IndexKeys.scope(principal, PURPOSE, SUBJECT)
                == keccak256(abi.encode(keccak256("efs2/vk/binding-scope/1"), principal, PURPOSE, SUBJECT)),
            "scope preimage"
        );
    }

    function testRepeatedEqualRefsStableDedupAcrossRoles() public view {
        TypeGroupParser.SchemaCache memory schema = parseLiteralSchema(
            2, hex"0001610700016207", bytes.concat(hex"0002", role(0, 1, 0), role(1, 1, 1)), hex"000202000201"
        );
        bytes32 ref = bytes32(uint256(0x20000));
        RecordBody.CheckedBody memory body = RecordBody.validate(schema, abi.encodePacked(ref, ref));
        bytes32[] memory keys = h.occurrenceKeys(schema, body, bytes32(uint256(0x30000)), bytes32(uint256(0x40000)));
        require(keys.length == 6, "three base general two predicates");
        require(keys[3] == IndexKeys.posting(bytes32(0), 5, 0, ref), "general backlink");
        require(keys[4] == IndexKeys.posting(schema.typeId, 6, 0, ref), "predicate zero");
        require(keys[5] == IndexKeys.posting(schema.typeId, 6, 1, ref), "predicate one");
    }

    function testSeparateScalarSpecsAndEqualDigestsDedupGlobally() public view {
        TypeGroupParser.SchemaCache memory scalars =
            parseLiteralSchema(2, hex"00016102010001620201", hex"0000", hex"000201000101");
        RecordBody.CheckedBody memory body = RecordBody.validate(scalars, hex"2a2a");
        bytes32[] memory keys = h.occurrenceKeys(scalars, body, TARGET, bytes32(uint256(0x40000)));
        require(keys.length == 5, "separate scalar ordinals");
        bytes32 value = IndexKeys.scalar(hex"2a");
        require(keys[3] == IndexKeys.posting(scalars.typeId, 7, 0, value), "scalar zero");
        require(keys[4] == IndexKeys.posting(scalars.typeId, 7, 1, value), "scalar one");

        TypeGroupParser.SchemaCache memory digests =
            parseLiteralSchema(2, hex"0001610a0001620a", hex"0000", hex"000203000301");
        bytes memory encoded = bytes.concat(hex"00120020", new bytes(32), hex"00120020", new bytes(32));
        body = RecordBody.validate(digests, encoded);
        keys = h.occurrenceKeys(digests, body, TARGET, bytes32(uint256(0x40000)));
        require(keys.length == 4, "equal digests dedup globally");
        bytes32 digestKey = IndexKeys.digest(0x12, new bytes(32));
        require(keys[3] == IndexKeys.posting(bytes32(0), 9, 0, digestKey), "global digest");
    }

    function testActualSixteenCandidateCachesAndZeroPresentOptions() public view {
        string memory json = vm.readFile("../2026-09-05-mvp-build-start/type-inputs/artifacts.v1.json");
        bytes32[] memory known = new bytes32[](16);
        uint256 cursor;
        uint256 backlinkSpecs;
        uint256 valueSpecs;
        for (uint256 groupIndex; groupIndex < 4; ++groupIndex) {
            string memory path = string.concat(".groups[", vm.toString(groupIndex), "].groupHex");
            bytes memory groupBytes = vm.parseBytes(string.concat("0x", vm.parseJsonString(json, path)));
            (, TypeGroupParser.SchemaCache[] memory schemas) = TypeGroupParser.parse(groupBytes, known);
            for (uint256 i; i < schemas.length; ++i) {
                RecordBody.CheckedBody memory body =
                    RecordBody.validate(schemas[i], minimalActualBody(schemas[i], cursor));
                bytes32[] memory keys = h.occurrenceKeys(
                    schemas[i], body, bytes32(uint256(0x10000 + cursor)), bytes32(uint256(0x20000 + cursor))
                );
                require(keys.length >= 3 && keys.length <= 43, "actual cache key bound");
                for (uint256 j; j < schemas[i].indexes.length; ++j) {
                    if (schemas[i].indexes[j].kind == 2) ++backlinkSpecs;
                    else ++valueSpecs;
                }
                known[cursor++] = schemas[i].typeId;
            }
        }
        require(cursor == 16, "all actual caches");
        require(backlinkSpecs == 27 && valueSpecs == 0, "actual declaration inventory");

        (BindingFold.KernelIds memory ids, TypeGroupParser.SchemaCache[] memory kernel) = kernelSchemas();
        RecordBody.CheckedBody memory absent =
            RecordBody.validate(kernel[0], bytes.concat(abi.encodePacked(PURPOSE, SUBJECT, FIELD_ROLE), hex"000000"));
        require(h.occurrenceKeys(kernel[0], absent, TARGET, SUBJECT).length == 3, "options absent");
        RecordBody.CheckedBody memory present = RecordBody.validate(
            kernel[0],
            bytes.concat(abi.encodePacked(PURPOSE, SUBJECT, FIELD_ROLE), hex"01", abi.encodePacked(TARGET), hex"0000")
        );
        require(h.occurrenceKeys(kernel[0], present, TARGET, SUBJECT).length == 5, "option present");
        require(ids.setType == kernel[0].typeId, "kernel identity reused");
    }

    function testMaximumFortyThreeKeysPreservesOrder() public view {
        bytes memory fields;
        bytes memory roles = hex"0010";
        bytes memory indexes = hex"0008";
        bytes memory raw;
        for (uint8 i; i < 16; ++i) {
            fields = bytes.concat(fields, abi.encodePacked(uint16(1), bytes1(bytes1(0x61 + i)), uint8(7)));
            roles = bytes.concat(roles, role(i, 1, i));
            raw = bytes.concat(raw, abi.encodePacked(bytes32(uint256(0x10000 + i))));
        }
        for (uint8 i; i < 8; ++i) {
            fields = bytes.concat(fields, abi.encodePacked(uint16(1), bytes1(bytes1(0x71 + i)), uint8(2), uint8(1)));
            indexes = bytes.concat(indexes, abi.encodePacked(uint8(1), uint8(16 + i)));
            raw = bytes.concat(raw, bytes1(i + 1));
        }
        TypeGroupParser.SchemaCache memory schema = parseLiteralSchema(24, fields, roles, indexes);
        RecordBody.CheckedBody memory body = RecordBody.validate(schema, raw);
        bytes32 recordId = bytes32(uint256(0x50000));
        bytes32 principalId = bytes32((uint256(1) << 255) | 0x60000);
        bytes32[] memory keys = h.occurrenceKeys(schema, body, recordId, principalId);
        require(keys.length == 43, "exact maximum");
        require(keys[0] == IndexKeys.posting(bytes32(0), 3, 0, recordId), "record first");
        require(keys[1] == IndexKeys.posting(schema.typeId, 1, 0, bytes32(0)), "type second");
        require(keys[2] == IndexKeys.posting(bytes32(0), 4, 0, principalId), "principal third");
        require(keys[35] == IndexKeys.posting(schema.typeId, 7, 0, IndexKeys.scalar(hex"01")), "specs after refs");
        require(keys[42] == IndexKeys.posting(schema.typeId, 7, 7, IndexKeys.scalar(hex"08")), "dense last spec");
    }

    function setEffect(
        uint8 targetKind,
        bytes32 target,
        uint16 targetLeaf,
        bool predecessorPresent,
        bytes32 predecessorEnvelope,
        uint16 predecessorLeaf
    ) internal pure returns (BindingFold.Effect memory e) {
        e.kind = 1;
        e.targetKind = targetKind;
        e.targetA = target;
        e.targetLeaf = targetLeaf;
        e.predecessorPresent = predecessorPresent;
        e.predecessor = BindingFold.OccurrenceRef(predecessorEnvelope, predecessorLeaf);
    }

    function tombstoneEffect(bool present, bytes32 envelopeId, uint16 leafIndex)
        internal
        pure
        returns (BindingFold.Effect memory e)
    {
        e.kind = 2;
        e.predecessorPresent = present;
        e.predecessor = BindingFold.OccurrenceRef(envelopeId, leafIndex);
    }

    function assertHead(
        BindingFold.Head memory head,
        uint8 state,
        uint32 revision,
        uint64 ordinal,
        uint8 targetKind,
        bytes32 target,
        uint16 targetLeaf,
        uint8 cause
    ) internal pure {
        require(head.state == state, "head state");
        require(head.revision == revision, "head revision");
        require(head.admissionOrdinal == ordinal, "head ordinal");
        require(head.targetKind == targetKind, "target kind");
        require(head.targetA == target, "head target");
        require(head.targetLeaf == targetLeaf, "target leaf");
        require(head.tombstoneCause == cause, "head cause");
    }

    function expectError(bytes memory callData, bytes memory expected) internal view {
        (bool ok, bytes memory actual) = address(h).staticcall(callData);
        require(!ok, "expected revert");
        require(keccak256(actual) == keccak256(expected), "exact revert data");
    }

    function expectSelector(bytes memory callData, bytes4 expected) internal view {
        (bool ok, bytes memory actual) = address(h).staticcall(callData);
        require(!ok && actual.length >= 4, "expected typed revert");
        bytes4 got;
        assembly { got := mload(add(actual, 32)) }
        require(got == expected, "revert selector");
    }

    function kernelSchemas()
        internal
        view
        returns (BindingFold.KernelIds memory ids, TypeGroupParser.SchemaCache[] memory schemas)
    {
        string memory json = vm.readFile("../2026-09-05-mvp-build-start/type-inputs/artifacts.v1.json");
        bytes memory groupBytes = vm.parseBytes(string.concat("0x", vm.parseJsonString(json, ".groups[1].groupHex")));
        (, schemas) = TypeGroupParser.parse(groupBytes, new bytes32[](0));
        ids = BindingFold.KernelIds(schemas[0].typeId, schemas[1].typeId, schemas[2].typeId);
    }

    function parseLiteralSchema(uint16 count, bytes memory fields, bytes memory roles, bytes memory indexes)
        internal
        pure
        returns (TypeGroupParser.SchemaCache memory)
    {
        bytes memory blob = bytes.concat(
            hex"0001000154000000", new bytes(32), abi.encodePacked(count), fields, roles, indexes, hex"00000000"
        );
        (, TypeGroupParser.SchemaCache[] memory schemas) = TypeGroupParser.parse(
            bytes.concat(hex"0001", abi.encodePacked(uint16(blob.length)), blob), new bytes32[](0)
        );
        return schemas[0];
    }

    function role(uint8 index, uint8 targetClass, uint8 fieldIndex) internal pure returns (bytes memory) {
        return bytes.concat(
            bytes1(index),
            hex"0001",
            bytes1(bytes1(0x41 + index)),
            bytes1(targetClass),
            bytes32(0),
            bytes1(fieldIndex),
            hex"0000"
        );
    }

    function minimalActualBody(TypeGroupParser.SchemaCache memory schema, uint256 seed)
        internal
        pure
        returns (bytes memory body)
    {
        uint256 refCounter;
        for (uint256 i; i < schema.fields.length; ++i) {
            TypeGroupParser.FieldCache memory field = schema.fields[i];
            uint256 constrainedMinimum;
            bool nonempty;
            for (uint256 j; j < schema.constraints.length; ++j) {
                if (schema.constraints[j].fieldIdx != i) continue;
                if (schema.constraints[j].kind == 1 && schema.constraints[j].min > 0) {
                    constrainedMinimum = uint256(schema.constraints[j].min);
                } else if (schema.constraints[j].kind == 2 || schema.constraints[j].kind == 3) {
                    nonempty = true;
                }
            }
            if (field.kind == 1) {
                body = bytes.concat(body, hex"00");
            } else if (field.kind >= 2 && field.kind <= 4) {
                body = bytes.concat(body, fixedWidth(field.widthOrMax, constrainedMinimum));
            } else if (field.kind == 5 || field.kind == 6) {
                if (nonempty) body = bytes.concat(body, hex"000178");
                else body = bytes.concat(body, hex"0000");
            } else if (field.kind == 11 || field.kind == 12) {
                body = bytes.concat(body, hex"0000");
            } else if (field.kind == 7) {
                body = bytes.concat(body, abi.encodePacked(bytes32(uint256(0x10000 + seed * 32 + refCounter++))));
            } else if (field.kind == 8) {
                body = bytes.concat(
                    body, abi.encodePacked(bytes32(uint256(0x10000 + seed * 32 + refCounter++)), uint16(i))
                );
            } else if (field.kind == 9) {
                body = bytes.concat(body, new bytes(32));
            } else if (field.kind == 10) {
                body = bytes.concat(body, hex"00120020", new bytes(32));
            } else if (field.kind == 14) {
                body = bytes.concat(body, hex"00");
            } else {
                revert("unexpected actual candidate kind");
            }
        }
    }

    function fixedWidth(uint256 width, uint256 value) internal pure returns (bytes memory out) {
        out = new bytes(width);
        for (uint256 i; i < width; ++i) {
            out[width - i - 1] = bytes1(uint8(value));
            value >>= 8;
        }
    }
}
