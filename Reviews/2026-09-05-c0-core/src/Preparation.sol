// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import {BindingFold} from "./BindingFold.sol";

library Preparation {
    struct Config {
        address helper;
        bytes32 codehash;
    }

    struct CompiledType {
        bytes32 typeId;
        bytes cacheBytes;
    }

    struct CompiledGroup {
        bytes32 groupHash;
        bytes32 rawHash;
        CompiledType[] types;
        bytes32[] dependencies;
    }

    struct PreparedRef {
        uint8 roleIndex;
        uint8 targetClass;
        bytes32 expectedType;
        bytes32 targetId;
        uint16 leafIndex;
    }

    struct PreparedRecord {
        PreparedRef[] references;
        bytes32[] occurrenceKeys;
        BindingFold.Effect effect;
    }
    error HelperIdentity();
    error HelperOutput(uint256 length);
    error HelperInput(uint256 length);
    error InvalidPreparation();
    // PROVISIONAL experiment ceilings, not final C0 caps.
    uint256 internal constant GROUP_OUTPUT = 131072;
    uint256 internal constant PREPARED_OUTPUT = 8192;
    uint256 internal constant INPUT_MAX = 163840;
    uint256 internal constant GROUP_GAS = 15000000;
    uint256 internal constant PREPARE_GAS = 5000000;

    function invoke(Config memory c, bytes memory input, uint256 maximum, uint256 gasLimit)
        internal
        view
        returns (bytes memory output)
    {
        if (c.helper.code.length == 0 || c.helper.codehash != c.codehash) revert HelperIdentity();
        if (input.length > INPUT_MAX) revert HelperInput(input.length);
        bool ok;
        uint256 n;
        address target = c.helper;
        assembly ("memory-safe") {
            ok := staticcall(gasLimit, target, add(input, 32), mload(input), 0, 0)
            n := returndatasize()
        }
        if (n > (ok ? maximum : 1024)) revert HelperOutput(n);
        output = new bytes(n);
        assembly ("memory-safe") { returndatacopy(add(output, 32), 0, n) }
        if (!ok) assembly ("memory-safe") { revert(add(output, 32), mload(output)) }
    }

    function intrinsic(Config memory c, bytes memory raw) internal view returns (CompiledType memory) {
        return
            abi.decode(
                invoke(c, abi.encodeCall(IPreparation.compileIntrinsic, (raw)), GROUP_OUTPUT, GROUP_GAS), (CompiledType)
            );
    }

    function group(Config memory c, bytes memory raw) internal view returns (CompiledGroup memory) {
        CompiledGroup memory g = abi.decode(
            invoke(c, abi.encodeCall(IPreparation.compileGroup, (raw)), GROUP_OUTPUT, GROUP_GAS), (CompiledGroup)
        );
        if (g.types.length == 0 || g.types.length > 16 || g.dependencies.length > 256) revert InvalidPreparation();
        return g;
    }

    function record(
        Config memory c,
        bytes memory cache,
        bytes32 typeId,
        bytes memory body,
        bytes32 recordId,
        bytes32 principal,
        BindingFold.KernelIds memory ids,
        bool bodyOnly
    ) internal view returns (PreparedRecord memory r) {
        r = abi.decode(
            invoke(
                c,
                abi.encodeCall(IPreparation.prepareRecord, (cache, typeId, body, recordId, principal, ids, bodyOnly)),
                PREPARED_OUTPUT,
                PREPARE_GAS
            ),
            (PreparedRecord)
        );
        if (r.references.length > 16 || r.occurrenceKeys.length > 43) revert InvalidPreparation();
    }
}

interface IPreparation {
    function compileIntrinsic(bytes calldata raw) external view returns (Preparation.CompiledType memory);
    function compileGroup(bytes calldata raw) external view returns (Preparation.CompiledGroup memory);
    function prepareRecord(
        bytes calldata cache,
        bytes32 typeId,
        bytes calldata body,
        bytes32 recordId,
        bytes32 principal,
        BindingFold.KernelIds calldata ids,
        bool bodyOnly
    ) external view returns (Preparation.PreparedRecord memory);
}
