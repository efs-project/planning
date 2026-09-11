// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import {Preparation} from "./Preparation.sol";
import {TypeGroupParser} from "C0Admission/TypeGroupParser.sol";
import {RecordBody} from "./RecordBody.sol";
import {BindingFold} from "./BindingFold.sol";
import {IndexKeys} from "./IndexKeys.sol";

contract PreparationHelper {
    error CacheDeployFailed();

    /// Deploys `0x00 || cache` as immutable runtime code and returns its address.
    /// Initcode: PUSH2 size, DUP1, PUSH1 10, RETURNDATASIZE, CODECOPY,
    /// RETURNDATASIZE, RETURN — ten bytes returning the payload that follows them.
    /// Inert public factory: the payload begins with STOP and can never execute;
    /// a core trusts only pointers it stored itself.
    function deployCache(bytes memory cache) external returns (address code) {
        uint256 n = cache.length;
        // Scratch use of free memory: nothing below depends on it.
        assembly ("memory-safe") {
            let init := mload(0x40)
            mstore(init, or(shl(248, 0x61), or(shl(232, add(n, 1)), shl(168, 0x80600a3d393df300))))
            mcopy(add(init, 11), add(cache, 32), n)
            code := create(0, init, add(n, 11))
        }
        if (code == address(0)) revert CacheDeployFailed();
    }

    function compileIntrinsic(bytes memory raw) external pure returns (Preparation.CompiledType memory out) {
        (, TypeGroupParser.SchemaCache[] memory ss) = TypeGroupParser.parse(raw, new bytes32[](0));
        if (
            ss.length != 1 || ss[0].fields.length != 1 || ss[0].roles.length != 0 || ss[0].indexes.length != 0
                || ss[0].constraints.length != 0
                || keccak256(ss[0].fields[0].descriptor) != keccak256(hex"000a67726f75704279746573051ffe")
        ) revert Preparation.InvalidPreparation();
        out = Preparation.CompiledType(ss[0].typeId, abi.encode(ss[0]));
    }

    function compileGroup(bytes memory raw) external pure returns (Preparation.CompiledGroup memory out) {
        TypeGroupParser.SchemaCache[] memory ss;
        (out.groupHash, ss, out.dependencies) = TypeGroupParser.parseWithDependencies(raw);
        out.rawHash = keccak256(raw);
        out.types = new Preparation.CompiledType[](ss.length);
        for (uint256 i; i < ss.length; ++i) {
            out.types[i] = Preparation.CompiledType(ss[i].typeId, abi.encode(ss[i]));
        }
    }

    function prepareRecord(
        bytes memory cache,
        bytes32 typeId,
        bytes memory body,
        bytes32 recordId,
        bytes32 principal,
        BindingFold.KernelIds memory ids,
        bool bodyOnly
    ) external pure returns (Preparation.PreparedRecord memory out) {
        if (cache.length > 131072) revert Preparation.HelperInput(cache.length);
        TypeGroupParser.SchemaCache memory s = abi.decode(cache, (TypeGroupParser.SchemaCache));
        if (s.typeId != typeId) revert Preparation.InvalidPreparation();
        RecordBody.CheckedBody memory checked = RecordBody.validate(s, body);
        out.references = new Preparation.PreparedRef[](checked.references.length);
        for (uint256 i; i < checked.references.length; ++i) {
            RecordBody.ReferenceValue memory ref = checked.references[i];
            TypeGroupParser.RoleCache memory role = s.roles[ref.roleIndex];
            out.references[i] =
                Preparation.PreparedRef(ref.roleIndex, role.targetClass, role.expectedType, ref.targetId, ref.leafIndex);
        }
        if (bodyOnly) {
            out.occurrenceKeys = new bytes32[](0);
        } else {
            out.occurrenceKeys = IndexKeys.occurrenceKeys(s, checked, recordId, principal);
            out.effect = BindingFold.decode(ids, typeId, checked);
        }
    }
}
