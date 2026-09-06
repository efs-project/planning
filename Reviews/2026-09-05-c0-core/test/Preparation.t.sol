// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import {Preparation, IPreparation} from "../src/Preparation.sol";
import {PreparationHelper} from "../src/PreparationHelper.sol";
import {TypeGroupParser} from "C0Admission/TypeGroupParser.sol";
import {RecordBody} from "../src/RecordBody.sol";
import {IndexKeys} from "../src/IndexKeys.sol";
import {BindingFold} from "../src/BindingFold.sol";

interface VmPrep {
    function readFile(string calldata) external view returns (string memory);
    function parseJsonString(string calldata, string calldata) external pure returns (string memory);
    function parseBytes(string calldata) external pure returns (bytes memory);
    function toString(uint256) external pure returns (string memory);
}

contract PreparationCallHarness {
    function invoke(Preparation.Config memory c, bytes memory b, uint256 n, uint256 g)
        external
        view
        returns (bytes memory)
    {
        return Preparation.invoke(c, b, n, g);
    }
}

contract PreparationBomb {
    fallback() external {
        assembly ("memory-safe") {
            let p := mload(0x40)
            mstore(0x40, add(p, 9024))
            return(p, 9000)
        }
    }
}

contract PreparationWriter {
    uint256 public writes;

    fallback() external {
        writes = 1;
    }
}

contract PreparationTest {
    VmPrep constant vm = VmPrep(address(uint160(uint256(keccak256("hevm cheat code")))));
    event log_named_uint(string key, uint256 val);
    bytes32 constant AUTHOR = bytes32(type(uint256).max);

    function testAllSixteenOpaqueCachesAndPreparationsMatchCurrentFunctions() public {
        PreparationHelper helper = new PreparationHelper();
        Preparation.Config memory c = Preparation.Config(address(helper), address(helper).codehash);
        string memory j = vm.readFile("../2026-09-05-mvp-build-start/type-inputs/artifacts.v1.json");
        bytes32[] memory known = new bytes32[](16);
        uint256 count;
        BindingFold.KernelIds memory ids;
        uint256 maxGroupOutput;
        uint256 maxGroupGas;
        uint256 maxPreparationInput;
        uint256 maxPreparationOutput;
        uint256 maxPreparationGas;
        for (uint256 g; g < 4; ++g) {
            bytes memory raw = vm.parseBytes(
                string.concat("0x", vm.parseJsonString(j, string.concat(".groups[", vm.toString(g), "].groupHex")))
            );
            (bytes32 gh, TypeGroupParser.SchemaCache[] memory schemas) = TypeGroupParser.parse(raw, known);
            uint256 beforeGas = gasleft();
            Preparation.CompiledGroup memory compiled = Preparation.group(c, raw);
            uint256 used = beforeGas - gasleft();
            if (used > maxGroupGas) maxGroupGas = used;
            uint256 outputLength = abi.encode(compiled).length;
            if (outputLength > maxGroupOutput) maxGroupOutput = outputLength;
            require(
                compiled.groupHash == gh && compiled.rawHash == keccak256(raw)
                    && compiled.types.length == schemas.length,
                "group identity and ordered cache count"
            );
            for (uint256 n; n < compiled.dependencies.length; ++n) {
                bool found;
                for (uint256 k; k < count; ++k) {
                    if (known[k] == compiled.dependencies[n]) found = true;
                }
                require(found, "returned dependencies already known");
            }
            if (g == 1) ids = BindingFold.KernelIds(schemas[0].typeId, schemas[1].typeId, schemas[2].typeId);
            for (uint256 m; m < schemas.length; ++m) {
                TypeGroupParser.SchemaCache memory s = schemas[m];
                known[count++] = s.typeId;
                bytes memory cache = abi.encode(s);
                require(
                    compiled.types[m].typeId == s.typeId && keccak256(compiled.types[m].cacheBytes) == keccak256(cache),
                    "opaque canonical cache bytes"
                );
                bytes memory body = candidateBody(s, s.typeId == ids.setType);
                bytes32 recordId = keccak256(abi.encode(keccak256("efs2/record/1"), s.typeId, keccak256(body)));
                RecordBody.CheckedBody memory checked = RecordBody.validate(s, body);
                bytes32[] memory keys = IndexKeys.occurrenceKeys(s, checked, recordId, AUTHOR);
                BindingFold.Effect memory effect = BindingFold.decode(ids, s.typeId, checked);
                beforeGas = gasleft();
                Preparation.PreparedRecord memory prepared =
                    Preparation.record(c, cache, s.typeId, body, recordId, AUTHOR, ids, false);
                used = beforeGas - gasleft();
                if (used > maxPreparationGas) maxPreparationGas = used;
                outputLength = abi.encode(prepared).length;
                if (outputLength > maxPreparationOutput) maxPreparationOutput = outputLength;
                uint256 inputLength =
                    abi.encodeCall(IPreparation.prepareRecord, (cache, s.typeId, body, recordId, AUTHOR, ids, false))
                .length;
                if (inputLength > maxPreparationInput) maxPreparationInput = inputLength;
                require(
                    keccak256(abi.encode(keys)) == keccak256(abi.encode(prepared.occurrenceKeys)),
                    "complete stable keys"
                );
                require(keys[0] == IndexKeys.posting(0, 3, 0, recordId), "byRecord stays first");
                require(keccak256(abi.encode(effect)) == keccak256(abi.encode(prepared.effect)), "exact effect");
                require(prepared.references.length == checked.references.length, "exact ref count");
                for (uint256 n; n < checked.references.length; ++n) {
                    RecordBody.ReferenceValue memory ref = checked.references[n];
                    TypeGroupParser.RoleCache memory role = s.roles[ref.roleIndex];
                    Preparation.PreparedRef memory got = prepared.references[n];
                    require(
                        got.roleIndex == ref.roleIndex && got.targetClass == role.targetClass
                            && got.expectedType == role.expectedType && got.targetId == ref.targetId
                            && got.leafIndex == ref.leafIndex,
                        "flat refs retain role metadata and traversal order"
                    );
                }
                Preparation.PreparedRecord memory bodyOnly =
                    Preparation.record(c, cache, s.typeId, body, recordId, AUTHOR, ids, true);
                require(
                    bodyOnly.occurrenceKeys.length == 0 && bodyOnly.effect.kind == 0
                        && keccak256(abi.encode(bodyOnly.references)) == keccak256(abi.encode(prepared.references)),
                    "retry body-only avoids effect/index preparation"
                );
            }
        }
        require(count == 16, "all sixteen candidates");
        emit log_named_uint("max group output bytes", maxGroupOutput);
        emit log_named_uint("max group call gas", maxGroupGas);
        emit log_named_uint("max preparation input bytes", maxPreparationInput);
        emit log_named_uint("max preparation output bytes", maxPreparationOutput);
        emit log_named_uint("max preparation call gas", maxPreparationGas);
    }

    function candidateBody(TypeGroupParser.SchemaCache memory s, bool bindingSet)
        private
        pure
        returns (bytes memory out)
    {
        for (uint256 i; i < s.fields.length; ++i) {
            TypeGroupParser.FieldCache memory f = s.fields[i];
            bytes memory value;
            if (f.kind == 1) {
                value = hex"00";
            } else if (f.kind >= 2 && f.kind <= 4) {
                value = new bytes(f.widthOrMax);
                uint256 n;
                for (uint256 q; q < s.constraints.length; ++q) {
                    if (s.constraints[q].kind == 1 && s.constraints[q].fieldIdx == i && s.constraints[q].min > 0) {
                        n = uint256(s.constraints[q].min);
                    }
                }
                for (uint256 q; q < value.length; ++q) {
                    value[value.length - 1 - q] = bytes1(uint8(n));
                    n >>= 8;
                }
            } else if (f.kind == 5 || f.kind == 6) {
                value = f.widthOrMax == 0 ? bytes(hex"0000") : bytes(hex"000178");
            } else if (f.kind == 7 || f.kind == 9) {
                value = abi.encodePacked(AUTHOR);
            } else if (f.kind == 8) {
                value = abi.encodePacked(AUTHOR, uint16(17));
            } else if (f.kind == 10) {
                value = abi.encodePacked(hex"00120020", AUTHOR);
            } else if (f.kind == 11) {
                value = hex"0000";
            } else if (f.kind == 14) {
                value = bindingSet && i == 3 ? abi.encodePacked(hex"01", AUTHOR) : bytes(hex"00");
            } else {
                revert("uncovered candidate field");
            }
            out = bytes.concat(out, value);
        }
    }

    function testHelperCodehashMismatchRejectsBeforeCall() public {
        PreparationCallHarness h = new PreparationCallHarness();
        PreparationHelper helper = new PreparationHelper();
        (bool ok, bytes memory e) = address(h)
            .staticcall(
                abi.encodeCall(
                    h.invoke,
                    (
                        Preparation.Config(address(helper), 0),
                        abi.encodeCall(IPreparation.compileGroup, (hex"0000")),
                        8192,
                        1000000
                    )
                )
            );
        require(!ok && bytes4(e) == Preparation.HelperIdentity.selector, "wrong helper must reject");
    }

    function testReturndataBoundAndStaticWriteRefusal() public {
        PreparationCallHarness h = new PreparationCallHarness();
        PreparationBomb bomb = new PreparationBomb();
        (bool ok, bytes memory e) = address(h)
            .staticcall(
                abi.encodeCall(
                    h.invoke, (Preparation.Config(address(bomb), address(bomb).codehash), hex"", 8192, 1000000)
                )
            );
        require(!ok && bytes4(e) == Preparation.HelperOutput.selector, "oversized output rejected before decode");
        PreparationWriter w = new PreparationWriter();
        (ok,) = address(h)
            .staticcall(
                abi.encodeCall(h.invoke, (Preparation.Config(address(w), address(w).codehash), hex"", 8192, 100000))
            );
        require(!ok && w.writes() == 0, "STATICCALL forbids helper writes");
    }

    function testInputBoundRejectsBeforeCall() public {
        PreparationCallHarness h = new PreparationCallHarness();
        PreparationBomb bomb = new PreparationBomb();
        (bool ok, bytes memory e) = address(h)
            .staticcall(
                abi.encodeCall(
                    h.invoke,
                    (Preparation.Config(address(bomb), address(bomb).codehash), new bytes(163841), 8192, 1000000)
                )
            );
        require(!ok && bytes4(e) == Preparation.HelperInput.selector, "oversized calldata rejected");
    }
}
