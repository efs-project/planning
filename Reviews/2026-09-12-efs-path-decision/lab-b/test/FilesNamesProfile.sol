// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Ledger} from "../src/Ledger.sol";
import {Keys} from "../src/Keys.sol";
import {TypeRegistry} from "../src/TypeRegistry.sol";
import {IAcceptor} from "../src/Interfaces.sol";
import {FilesLayout, FilesParentIndex} from "./FilesJoinedProfile.sol";

/// Disposable raw-hash ASCII names profile, not Unicode FilesName or hierarchical DirectoryEntry.
library FilesNameLayout {
    bytes32 internal constant SHAPE = keccak256("lab/type/files-name-raw-ascii/1");
    bytes32 internal constant FOLDER = keccak256("efs2/purpose/folder/1");
    error E_NAME_PROFILE();

    function valid(bytes memory value) internal pure returns (bool) {
        uint256 n = value.length;
        if (n == 0 || n > 255) return false;
        if (value[0] == bytes1(".") && (n == 1 || (n == 2 && value[1] == bytes1(".")))) return false;
        for (uint256 i; i < n; ++i) {
            uint8 c = uint8(value[i]);
            if (!((c >= 97 && c <= 122) || (c >= 48 && c <= 57) || c == 46 || c == 95 || c == 45)) return false;
        }
        return true;
    }

    /// Fixed output buffer bounds even an untrusted response source. Status: 0 unavailable,
    /// 1 structurally decoded, 3 malformed. Occurrences is ABI-checked, never a validity gate.
    function load(address source, bytes32 id) internal view
        returns (uint8 status, bytes32 t, uint64 first, bytes memory value)
    {
        bytes memory input = abi.encodeWithSelector(IFilesNameSource.record.selector, id);
        bytes memory output = new bytes(416); // four ABI head words + length + at most 255 padded bytes
        bool ok;
        uint256 size;
        assembly ("memory-safe") {
            ok := staticcall(100000, source, add(input, 32), mload(input), add(output, 32), 416)
            size := returndatasize()
        }
        if (!ok) return (0, bytes32(0), 0, new bytes(0));
        if (size < 160 || size > 416) return (3, bytes32(0), 0, new bytes(0));
        uint256 firstWord;
        uint256 occurrences;
        uint256 offset;
        uint256 n;
        assembly ("memory-safe") {
            t := mload(add(output, 32))
            firstWord := mload(add(output, 64))
            occurrences := mload(add(output, 96))
            offset := mload(add(output, 128))
            n := mload(add(output, 160))
        }
        if (offset != 128 || firstWord > type(uint64).max || occurrences > type(uint32).max
            || n > 255 || size != 160 + ((n + 31) / 32) * 32) return (3, bytes32(0), 0, new bytes(0));
        value = new bytes(n);
        for (uint256 i; i < n; ++i) value[i] = output[160 + i];
        return (1, t, uint64(firstWord), value);
    }

    function pin(Ledger core, bytes32 nameType, bytes32 expectedRuleHash) internal view {
        TypeRegistry types = TypeRegistry(address(core.registry()));
        (bytes32 shape, bytes32 ruleHash, address rule, uint8 count,,) = types.descriptor(nameType);
        bytes32[] memory refs = types.refTypes(nameType);
        if (nameType == 0 || expectedRuleHash == 0 || shape != SHAPE || count != 0 || refs.length != 0
            || rule.code.length == 0 || ruleHash != expectedRuleHash || rule.codehash != expectedRuleHash
            || Keys.typeId(shape, refs, ruleHash) != nameType) revert E_NAME_PROFILE();
    }
}

contract FilesNameRule is IAcceptor {
    function accept(bytes32, bytes calldata data, bytes32[] calldata refs) external pure returns (bool) {
        if (refs.length != 0 || data.length == 0 || data.length > 255) return false;
        return FilesNameLayout.valid(data);
    }
}

contract FilesNamesIndex is FilesParentIndex {
    bytes32 public immutable nameType;
    bytes32 public immutable expectedNameRuleHash;
    error E_NAME_REQUIRED(bytes32 position, bytes32 nameRecord);

    constructor(address core, bytes32 rt, bytes32 ct, bytes32 rh, bytes32 ch, bytes32 nt, bytes32 nh)
        FilesParentIndex(core, rt, ct, rh, ch)
    {
        FilesNameLayout.pin(Ledger(core), nt, nh);
        nameType = nt;
        expectedNameRuleHash = nh;
    }

    function onAdmission(uint64 publication, Effect[] calldata effects) public override {
        super.onAdmission(publication, effects);
        Ledger core = Ledger(ledger);
        FilesNameLayout.pin(core, nameType, expectedNameRuleHash);
        if (effects.length == 0) return;
        // Ledger invokes us once after all actions. A Name after BIND is already retained.
        uint64 through = effects[effects.length - 1].admission;
        for (uint256 i; i < effects.length; ++i) {
            if (effects[i].kind != 3) continue;
            bytes32 position = core.bindingPosition(effects[i].bindingOrdinal);
            (bytes32 purpose, bytes32 folder, bytes32 role) = core.positionCell(position);
            if (purpose != FilesNameLayout.FOLDER) continue;
            bytes32 id = Keys.recordFromHash(nameType, role);
            (uint8 status, bytes32 t, uint64 first, bytes memory value) = FilesNameLayout.load(ledger, id);
            if (position != Keys.position(purpose, folder, role)
                || effects[i].bindingKey != Keys.binding(effects[i].author, position)
                || effects[i].scopeKey != Keys.scope(effects[i].author, purpose, folder)
                || status != 1 || t != nameType || first == 0 || first > through
                || !FilesNameLayout.valid(value) || keccak256(value) != role
                || Keys.recordFromHash(t, keccak256(value)) != id) revert E_NAME_REQUIRED(position, id);
        }
    }
}

interface IFilesNameSource {
    function record(bytes32 id) external view returns (bytes32, uint64, uint32, bytes memory);
}

/// Caller supplies an independently verified placement; this helper DOES NOT establish
/// membership, author selection, block authenticity, full paths, or named-list completeness.
contract FilesNameReader {
    uint8 public constant UNAVAILABLE = 0;
    uint8 public constant FOUND = 1;
    uint8 public constant MISSING = 2;
    uint8 public constant INVALID = 3;
    struct Basis { uint64 admission; uint64 epoch; bytes32 core; }
    struct Name { uint8 status; bytes32 recordId; uint64 firstAdmission; bytes value; }
    Ledger public immutable ledger;
    bytes32 public immutable coreCodehash;
    IFilesNameSource public immutable source;
    bytes32 public immutable nameType;
    bytes32 public immutable expectedNameRuleHash;
    error E_BASIS();
    error E_POSITION();

    constructor(Ledger core, address source_, bytes32 nt, bytes32 nh) {
        FilesNameLayout.pin(core, nt, nh);
        ledger = core;
        coreCodehash = address(core).codehash;
        source = IFilesNameSource(source_);
        nameType = nt;
        expectedNameRuleHash = nh;
    }

    function readName(bytes32 position, bytes32 folder, bytes32 role, Basis calldata basis) external view returns (Name memory result) {
        (uint64 admission,,,) = ledger.counts();
        if (basis.admission != admission || basis.epoch != ledger.registry().epoch()
            || basis.core != coreCodehash || address(ledger).codehash != coreCodehash) revert E_BASIS();
        FilesNameLayout.pin(ledger, nameType, expectedNameRuleHash);
        (bytes32 purpose, bytes32 retainedFolder, bytes32 retainedRole) = ledger.positionCell(position);
        if (purpose != FilesNameLayout.FOLDER || retainedFolder != folder || retainedRole != role
            || position != Keys.position(purpose, folder, role)) revert E_POSITION();
        result.recordId = Keys.recordFromHash(nameType, role);
        (uint8 status, bytes32 t, uint64 first, bytes memory value) = FilesNameLayout.load(address(source), result.recordId);
        if (status == 0) { result.status = UNAVAILABLE; return result; }
        if (status != 1) { result.status = INVALID; return result; }
        if (t == 0 && first == 0 && value.length == 0) { result.status = MISSING; return result; }
        if (t != nameType || first == 0 || first > basis.admission || !FilesNameLayout.valid(value)
            || keccak256(value) != role || Keys.recordFromHash(t, keccak256(value)) != result.recordId) {
            result.status = INVALID; return result;
        }
        // A correct preimage does not authenticate the response source's admission metadata.
        (bytes32 coreType, uint64 coreFirst, uint32 coreLength) = FilesLayout.header(ledger, result.recordId);
        if (t != coreType || first != coreFirst || value.length != coreLength) {
            result.status = INVALID; return result;
        }
        result.status = FOUND;
        result.firstAdmission = first;
        result.value = value;
    }
}
