// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {CanonicalTypeRegistry} from "./CanonicalTypeRegistry.sol";
import {BodyWriter} from "./BodyWriter.sol";
import {RecordInventoryIndex} from "./RecordInventoryIndex.sol";

/// @notice Permissionless author-neutral typed bytes, not authorship or full-v2 Core.
contract NativeRecordKernel {
    struct Record {
        bytes32 typeId;
        bytes body;
    }

    struct StoredRecord {
        bytes32 typeId;
        address pointer;
        uint16 bodyLength;
        bool present;
        uint8 backend;
    }

    CanonicalTypeRegistry public immutable types;
    RecordInventoryIndex public immutable recordInventory;
    BodyWriter public immutable bodyWriter;
    bytes32 private immutable bodyWriterCodeHash;
    bytes32 private immutable inventoryCodeHash;
    uint256 public constant MAX_BODY = 4096;
    bytes32 public constant RECORD_DOMAIN = keccak256("efs2/record/1");
    mapping(bytes32 => StoredRecord) private records;
    mapping(bytes32 => bytes32[128]) private sparseBodyWords;
    error MissingRecord();
    error CorruptRecord();
    error BodyWriterUnavailable();
    error RecordInventoryUnavailable();
    error BodyTooLarge();
    event RecordStored(bytes32 indexed recordId, bytes32 indexed typeId);

    constructor(address helper) {
        types = new CanonicalTypeRegistry(helper);
        recordInventory = new RecordInventoryIndex();
        inventoryCodeHash = address(recordInventory).codehash;
        bodyWriter = new BodyWriter();
        bodyWriterCodeHash = address(bodyWriter).codehash;
    }

    function storeRecord(bytes32 typeId, bytes calldata body) external returns (bytes32) {
        return _store(typeId, body);
    }

    function recordId(bytes32 typeId, bytes memory body) public pure returns (bytes32) {
        return keccak256(abi.encode(RECORD_DOMAIN, typeId, keccak256(body)));
    }

    function readRecord(bytes32 id) external view returns (Record memory) {
        StoredRecord storage stored = records[id];
        if (!stored.present) revert MissingRecord();
        address pointer = stored.pointer;
        uint256 length = stored.bodyLength;
        uint8 backend = stored.backend;
        if (length > MAX_BODY || backend > 1) revert CorruptRecord();
        bytes memory body = new bytes(length);
        if (backend == 0) {
            if (pointer == address(0) || pointer.code.length != length + 1) revert CorruptRecord();
            uint256 prefix;
            assembly ("memory-safe") {
                let scratch := mload(0x40)
                extcodecopy(pointer, scratch, 0, 1)
                prefix := byte(0, mload(scratch))
            }
            if (prefix != 0) revert CorruptRecord();
            assembly ("memory-safe") { extcodecopy(pointer, add(body, 32), 1, length) }
        } else {
            if (pointer != address(0)) revert CorruptRecord();
            uint256 count = (length + 31) / 32;
            for (uint256 i; i < count; ++i) {
                bytes32 word = sparseBodyWords[id][i];
                uint256 remaining = length - i * 32;
                if (remaining < 32 && uint256(word) << (remaining * 8) != 0) revert CorruptRecord();
                assembly ("memory-safe") { mstore(add(add(body, 32), mul(i, 32)), word) }
            }
        }
        Record memory result = Record(stored.typeId, body);
        if (recordId(result.typeId, result.body) != id) revert CorruptRecord();
        return result;
    }

    function _store(bytes32 typeId, bytes calldata body) private returns (bytes32 id) {
        if (body.length > MAX_BODY) revert BodyTooLarge();
        types.validate(typeId, body);
        id = recordId(typeId, body);
        if (!records[id].present) {
            if (address(bodyWriter).codehash != bodyWriterCodeHash) revert BodyWriterUnavailable();
            uint256 count = (body.length + 31) / 32;
            uint256 nonzero;
            for (uint256 i; i < count; ++i) {
                if (_bodyWord(body, i) != 0) ++nonzero;
            }
            uint8 backend = _selectBodyBackend(body.length, nonzero);
            address pointer;
            if (backend == 0) {
                pointer = bodyWriter.write(body);
            } else {
                for (uint256 i; i < count; ++i) {
                    bytes32 word = _bodyWord(body, i);
                    if (word != 0) sparseBodyWords[id][i] = word;
                }
            }
            // MAX_BODY is checked above, before the narrowing conversion.
            // forge-lint: disable-next-line(unsafe-typecast)
            records[id] = StoredRecord(typeId, pointer, uint16(body.length), true, backend);
            _noteRecord(typeId, id);
            emit RecordStored(id, typeId);
        }
    }

    function _bodyWord(bytes calldata body, uint256 index) private pure returns (bytes32 word) {
        uint256 offset = index * 32;
        assembly ("memory-safe") { word := calldataload(add(body.offset, offset)) }
        uint256 remaining = body.length - offset;
        if (remaining < 32) word &= bytes32(type(uint256).max << ((32 - remaining) * 8));
    }

    // Experimental write-oriented proxy fitted to the retained 48-case forced-path calibration.
    // Nonzero fresh slots ~22.3k each; bounded words-loop premium ~240 per word;
    // code creation/helper fixed ~33.5k plus 200 per deposited byte. Not an opcode
    // oracle or a lifetime optimum: paid reads are reported separately. Exact ties use code.
    function _selectBodyBackend(uint256 length, uint256 nonzero) internal pure virtual returns (uint8) {
        uint256 wordsCost = 22_300 * nonzero + 240 * ((length + 31) / 32);
        uint256 codeCost = 33_500 + 200 * length;
        return wordsCost < codeCost ? 1 : 0;
    }

    function _noteRecord(bytes32 typeId, bytes32 id) private {
        address target = address(recordInventory);
        if (target.codehash != inventoryCodeHash) revert RecordInventoryUnavailable();
        bytes memory input = abi.encodeCall(recordInventory.noteRecord, (typeId, id));
        bytes32 marker = keccak256("EFS21_RECORD_INVENTORY_OK");
        bool ok;
        assembly ("memory-safe") {
            let out := mload(0x40)
            mstore(out, 0)
            ok := call(gas(), target, 0, add(input, 32), mload(input), out, 32)
            ok := and(and(ok, eq(returndatasize(), 32)), eq(mload(out), marker))
        }
        if (!ok) revert RecordInventoryUnavailable();
    }
}
